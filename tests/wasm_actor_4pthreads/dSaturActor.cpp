#include <atomic>
#include <condition_variable>
#include <functional>
#include <future>
#include <iostream>
#include <mutex>
#include <queue>
#include <thread>
#include <vector>
#include <algorithm>
#include <emscripten.h>
#include <emscripten/threading.h>

struct Node
{
    int key;
    int color;
    int weight;
    int lock;
    Node(int k, int c, int w, int l) : key(k), color(c), weight(w), lock(l) {}
};

struct Link
{
    int from;
    int to;
    Link(int f, int t) : from(f), to(t) {}
};

extern "C"
{
    // Deklariert die JavaScript-Funktion
    EM_JS(void, changeNodeColorJS, (int nodeKey, int newColorCode, int thread), {
        // Rufe die JavaScript-Funktion auf
        Module.changeNodeColor(nodeKey, newColorCode, thread);
    });

    // C-Wrapper-Funktion, die als Callback fungiert
    void changeNodeColorCallback(int nodeKey, int newColorCode, int thread)
    {
        changeNodeColorJS(nodeKey, newColorCode, thread);
    }

    // Deklariert die JavaScript-Funktion
    EM_JS(void, threadsFinishedJS, (), {
        // Rufe die JavaScript-Funktion auf
        Module.threadsFinished();
    });
}

class TaskQueue
{
public:
    TaskQueue() : shutdown(false) {}

    void enqueue(std::function<void()> task)
    {
        {
            std::lock_guard<std::mutex> lock(mutex);
            tasks.push(task);
        }
        cond.notify_one();
    }

    std::function<void()> dequeue()
    {
        std::unique_lock<std::mutex> lock(mutex);
        cond.wait(lock, [this]
                  { return shutdown || !tasks.empty(); });
        if (tasks.empty())
            return nullptr;
        auto task = tasks.front();
        tasks.pop();
        return task;
    }

    void close()
    {
        shutdown = true;
        cond.notify_all();
    }

    bool isEmpty() const
    {
        std::lock_guard<std::mutex> lock(mutex);
        return tasks.empty();
    }

private:
    mutable std::mutex mutex;
    std::condition_variable cond;
    std::queue<std::function<void()>> tasks;
    std::atomic<bool> shutdown;
};
class Actor
{
public:
    Actor(unsigned int numThreads, std::vector<Node> &nodes, std::vector<Link> &links, int terms)
        : tasksCompletedPromise(new std::promise<void>()), nodes(nodes), links(links), globalTerms(terms)
    {
        tasksCompletedFuture = tasksCompletedPromise->get_future();

        for (unsigned int i = 0; i < numThreads; ++i)
        {
            workerThreads.emplace_back([this]
                                       {
                while (true) {
                    auto task = taskQueue.dequeue();
                    if (!task) break; // Exit if queue is closed and empty
                    task();
                } });
        }

        // Add initial tasks based on the number of threads or elements size
        for (size_t i = 0; i < numThreads; ++i)
        {
            addNextTask();
        }
    }

    ~Actor()
    {
        taskQueue.close();
        for (auto &thread : workerThreads)
        {
            thread.join();
        }
        delete tasksCompletedPromise;
    }

    void waitForTasksCompletion()
    {
        tasksCompletedFuture.wait();
    }

    std::vector<Node> nodes;
    std::vector<Link> links;
    int globalTerms;

private:
    std::vector<std::thread> workerThreads;
    TaskQueue taskQueue;
    std::promise<void> *tasksCompletedPromise;
    std::future<void> tasksCompletedFuture;

    void addNextTask()
    {
        if (!areAllNodesColored())
        {
            Node *nodeToColor = selectNode();
            if (nodeToColor != nullptr)
            {
                lockAdjacentNodes(*nodeToColor);
                taskQueue.enqueue([this, nodeToColor]()
                                  {
                int color = dSaturSingleNode(nodeToColor->key);
                changeNodeColorJS(nodeToColor->key, color,0);
                updateSaturation(nodeToColor->key);
                unlockAdjacentNodes(*nodeToColor);
                if (!areAllNodesColored()) {
                    addNextTask();
                } else {
                    std::lock_guard<std::mutex> lock(fulfillMutex);
                    if (!promiseFulfilled) {
                        tasksCompletedPromise->set_value();
                        promiseFulfilled = true;
                    }
                } });
            }
        }
    }
    std::mutex fulfillMutex;
    bool promiseFulfilled = false;
    void lockAdjacentNodes(Node &node)
    {
        node.lock = node.lock + 1;

        for (const auto &link : links)
        {
            if (link.from == node.key || link.to == node.key)
            {
                int targetNodeKey = (link.from == node.key) ? link.to : link.from;
                auto targetNodeIter = std::find_if(nodes.begin(), nodes.end(), [targetNodeKey](const Node &n)
                                                   { return n.key == targetNodeKey; });

                if (targetNodeIter != nodes.end())
                {
                    targetNodeIter->lock += 1;
                }
            }
        }
    }

    void unlockAdjacentNodes(Node &node)
    {
        node.lock = node.lock - 1;

        for (const auto &link : links)
        {
            if (link.from == node.key || link.to == node.key)
            {
                int targetNodeKey = (link.from == node.key) ? link.to : link.from;
                auto targetNodeIter = std::find_if(nodes.begin(), nodes.end(), [targetNodeKey](const Node &n)
                                                   { return n.key == targetNodeKey; });

                if (targetNodeIter != nodes.end())
                {
                    targetNodeIter->lock = targetNodeIter->lock - 1;
                }
            }
        }
    }

    int countLinksForNode(int nodeKey)
    {
        int count = 0;
        for (const auto &link : links)
        {
            if (link.from == nodeKey || link.to == nodeKey)
            {
                ++count;
            }
        }
        return count;
    }

    // Wähle den Knoten für die Färbung aus
    Node *selectNode()
    {
        Node *nodeToColor = nullptr;
        int maxWeight = std::numeric_limits<int>::min();
        int maxLinkCount = std::numeric_limits<int>::min();

        for (auto &currNode : nodes)
        {
            if (currNode.color == 0)
            { // Knoten noch nicht gefärbt
                int weight = currNode.weight;
                int linkCount = countLinksForNode(currNode.key);

                if (weight > maxWeight || (weight == maxWeight && linkCount > maxLinkCount))
                {
                    nodeToColor = &currNode; // Aktualisiere den zu färbenden Knoten
                    maxWeight = weight;
                    maxLinkCount = linkCount;
                }
            }
        }

        return nodeToColor;
    }

    Node *findNodeByKey(int key)
    {
        for (auto &node : nodes)
        {
            if (node.key == key)
            {
                return &node;
            }
        }
        return nullptr;
    }

    void updateSaturation(int nodeKey)
    {
        for (const auto &link : links)
        {
            Node *targetNode = nullptr;
            if (link.from == nodeKey)
            {
                targetNode = findNodeByKey(link.to);
            }
            else if (link.to == nodeKey)
            {
                targetNode = findNodeByKey(link.from);
            }

            if (targetNode != nullptr && targetNode->color == 0)
            {
                targetNode->weight++;
            }
        }
    }

    double calculatePiLeibniz(int terms)
    {
        double sum = 0.0;
        for (int i = 0; i < terms; i++)
        {
            if (i % 2 == 0)
            {
                sum += 1.0 / (2 * i + 1);
            }
            else
            {
                sum -= 1.0 / (2 * i + 1);
            }
        }
        return 4 * sum;
    }

    int dSaturSingleNode(int nodeKey)
    {
        int color = 1;
        bool adjacentColored;
        do
        {
            adjacentColored = false;
            for (const auto &link : links)
            {
                if (link.from == nodeKey || link.to == nodeKey)
                {
                    auto findIt = (link.from == nodeKey) ? std::find_if(nodes.begin(), nodes.end(), [&](const Node &n)
                                                                        { return n.key == link.to; })
                                                         : std::find_if(nodes.begin(), nodes.end(), [&](const Node &n)
                                                                        { return n.key == link.from; });
                    if (findIt != nodes.end())
                    {
                        auto &targetNode = *findIt;
                        if (targetNode.color == color)
                        {
                            adjacentColored = true;
                            break;
                        }
                    }
                }
            }
            if (adjacentColored)
                ++color;
        } while (adjacentColored);

        calculatePiLeibniz(globalTerms);
        return color;
    }

    bool areAllNodesColored()
    {
        return std::all_of(nodes.begin(), nodes.end(), [](const Node &node)
                           { return node.color != 0; });
    }
};

extern "C"
{
    void processGraph(int32_t *nodesData, int nodeCount, int32_t *linksData, int linkCount, int terms, int threads)
    {
        std::vector<Node> currnodes;
        std::vector<Link> currlinks;
        for (int i = 0; i < nodeCount; ++i)
        {
            currnodes.emplace_back(nodesData[i * 4], nodesData[i * 4 + 1], nodesData[i * 4 + 2], nodesData[i * 4 + 3]);
        }

        for (int i = 0; i < linkCount; ++i)
        {
            currlinks.emplace_back(linksData[i * 2], linksData[i * 2 + 1]);
        }
        Actor actor(threads, currnodes, currlinks, terms);

        actor.waitForTasksCompletion();

        std::cout << "Alle Aufgaben sind abgeschlossen." << std::endl;
        threadsFinishedJS();
    }
}