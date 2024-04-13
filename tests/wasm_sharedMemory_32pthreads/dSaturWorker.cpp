#include <emscripten/threading.h>
#include <iostream>
#include <vector>
#include <algorithm>
#include <atomic>
#include <emscripten.h>

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
}

// Deklariert die JavaScript-Funktion
EM_JS(void, threadsFinishedJS, (), {
    // Rufe die JavaScript-Funktion auf
    Module.threadsFinished();
});

struct Node
{
    int key;
    std::atomic<int> color;
    std::atomic<int> weight;
    std::atomic<int> lock;

    // Default-Konstruktor
    Node() : key(0), color(0), weight(0), lock(0) {}

    // Konstruktor mit Parametern
    Node(int k, int c, int w, int l) : key(k), color(c), weight(w), lock(l) {}

    // Kopierkonstruktor und Zuweisungsoperator explizit löschen
    Node(const Node &) = delete;
    Node &operator=(const Node &) = delete;

    // Move-Konstruktor
    Node(Node &&other) noexcept : key(other.key), color(other.color.load()), weight(other.weight.load()), lock(other.lock.load()) {}

    // Move-Zuweisungsoperator
    Node &operator=(Node &&other) noexcept
    {
        key = other.key;
        color.store(other.color.load());
        weight.store(other.weight.load());
        lock.store(other.lock.load());
        return *this;
    }
};
struct Link
{
    int from;
    int to;
};

struct ThreadData
{
    std::vector<Node> *nodes;
    std::vector<Link> *links;
    int terms;
    int threadId;

    ThreadData(std::vector<Node> *n, std::vector<Link> *l, int t, int id) : nodes(n), links(l), terms(t), threadId(id) {}
};

int countLinksForNode(int nodeKey, const std::vector<Link> &links)
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
Node *selectNode(std::vector<Node> &nodes, const std::vector<Link> &links)
{
    Node *nodeToColor = nullptr;
    int maxWeight = std::numeric_limits<int>::min();
    int maxLinkCount = std::numeric_limits<int>::min();

    for (auto &currNode : nodes)
    {
        if (currNode.color.load() == 0 && currNode.lock.load() == 0)
        { // Knoten noch nicht gefärbt
            int weight = currNode.weight.load();
            int linkCount = countLinksForNode(currNode.key, links);

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

Node *findNodeByKey(std::vector<Node> &nodes, int key)
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

void updateSaturation(int nodeKey, int color, std::vector<Node> &nodes, const std::vector<Link> &links)
{
    for (const auto &link : links)
    {
        Node *targetNode = nullptr;
        if (link.from == nodeKey)
        {
            targetNode = findNodeByKey(nodes, link.to);
        }
        else if (link.to == nodeKey)
        {
            targetNode = findNodeByKey(nodes, link.from);
        }

        if (targetNode != nullptr && targetNode->color.load() == 0)
        {
            targetNode->weight.fetch_add(1);
        }
    }
}

void lockAdjacentNodes(Node &node, std::vector<Node> &nodes, const std::vector<Link> &links)
{
    node.lock.fetch_add(1); // Schließt den aktuellen Knoten

    for (const auto &link : links)
    {
        if (link.from == node.key || link.to == node.key)
        {
            int targetNodeKey = (link.from == node.key) ? link.to : link.from;
            auto targetNodeIter = std::find_if(nodes.begin(), nodes.end(), [targetNodeKey](const Node &n)
                                               { return n.key == targetNodeKey; });

            if (targetNodeIter != nodes.end())
            {
                targetNodeIter->lock.fetch_add(1); // Schließt den angrenzenden Knoten
            }
        }
    }
}

void unlockAdjacentNodes(Node &node, std::vector<Node> &nodes, const std::vector<Link> &links)
{
    node.lock.fetch_sub(1); // Entsperren des aktuellen Knotens

    for (const auto &link : links)
    {
        if (link.from == node.key || link.to == node.key)
        {
            int targetNodeKey = (link.from == node.key) ? link.to : link.from;
            auto targetNodeIter = std::find_if(nodes.begin(), nodes.end(), [targetNodeKey](const Node &n)
                                               { return n.key == targetNodeKey; });

            if (targetNodeIter != nodes.end())
            {
                targetNodeIter->lock.fetch_sub(1);
                ; // Entsperren des angrenzenden Knotens
            }
        }
    }
}

double calculatePiLeibniz(int terms)
{
    double sum = 0.0;
    for (int i = 0; i < terms; i++)
    {
        std::cout << "calculate term" << std::endl;
        if (i % 2 == 0)
        {
            sum += 1.0 / (2 * i + 1);
        }
        else
        {
            sum -= 1.0 / (2 * i + 1);
        }
    }
    std::cout << sum << std::endl;
    return 4 * sum;
}

void *dSatur(void *arg)
{
    auto data = static_cast<ThreadData *>(arg);
    auto &nodes = *(data->nodes);
    auto &links = *(data->links);
    int terms = data->terms;
    int threadId = data->threadId;
    Node *node = selectNode(nodes, links);
    while (node != nullptr)
    {
        int color = 1;
        bool adjacentColored;
        do
        {
            adjacentColored = false;
            for (const auto &link : links)
            {
                if (link.from == node->key || link.to == node->key)
                {
                    auto &targetNode = (link.from == node->key) ? *std::find_if(nodes.begin(), nodes.end(), [&](const Node &n)
                                                                                { return n.key == link.to; })
                                                                : *std::find_if(nodes.begin(), nodes.end(), [&](const Node &n)
                                                                                { return n.key == link.from; });
                    if (targetNode.color.load() == color)
                    {
                        adjacentColored = true;
                        break;
                    }
                }
            }
            if (adjacentColored)
                ++color;
        } while (adjacentColored);
        if (node->color.load() == 0)
        {
            if (node->lock.load() == 0)
            {
                lockAdjacentNodes(*node, nodes, links);
                node->color.store(color);
                updateSaturation(node->key, color, nodes, links);
                calculatePiLeibniz(terms); // Simuliere Berechnungsaufwand
                unlockAdjacentNodes(*node, nodes, links);
                // changeNodeColorJS(node->key, node->color, threadId);
                emscripten_async_run_in_main_runtime_thread(EM_FUNC_SIG_VIII, changeNodeColorCallback, node->key, color, threadId);
            }
        }
        node = selectNode(nodes, links);
    }
    return nullptr;
}

void invokeThreads(int numThreads, std::vector<Node> &nodes, std::vector<Link> &links, int terms)
{
    pthread_t threads[numThreads];
    std::vector<ThreadData *> threadData; // Verwende einen Vektor von Zeigern auf ThreadData

    for (int i = 0; i < numThreads; ++i)
    {
        // Dynamisch ein neues ThreadData Objekt für jeden Thread erstellen
        ThreadData *data = new ThreadData(&nodes, &links, terms, i);
        threadData.push_back(data); // Füge den Zeiger zum Vektor hinzu
        pthread_create(&threads[i], nullptr, dSatur, data);
    }

    for (int i = 0; i < numThreads; ++i)
    {
        pthread_join(threads[i], nullptr);
    }

    // Speicher für jedes ThreadData Objekt freigeben
    for (ThreadData *data : threadData)
    {
        delete data;
    }
    threadsFinishedJS();
}

void serializeBackToInt32Array(std::vector<Node> &nodes, int32_t *nodesData)
{
    for (size_t i = 0; i < nodes.size(); ++i)
    {
        nodesData[i * 4] = nodes[i].key;
        nodesData[i * 4 + 1] = nodes[i].color.load();
        nodesData[i * 4 + 2] = nodes[i].weight.load();
        nodesData[i * 4 + 3] = nodes[i].lock.load();
    }
}

// Funktion, um die Vektorinhalte zu loggen:
void logNodes(const std::vector<Node> &nodes)
{
    std::cout << "Nodes:" << std::endl;
    for (const auto &node : nodes)
    {
        std::cout << "Key: " << node.key << ", Color: " << node.color << ", Weight: " << node.weight << ", Lock: " << node.lock << std::endl;
    }
}

void logNodesFromIntArray(const int32_t *nodesData, int nodeCount)
{
    std::cout << "Nodes from Int32 Array:" << std::endl;
    for (int i = 0; i < nodeCount; ++i)
    {
        // Berechne den Basisindex für den aktuellen Knoten im Array
        int baseIndex = i * 4;

        // Extrahiere die Werte für den aktuellen Knoten
        int key = nodesData[baseIndex];
        int color = nodesData[baseIndex + 1];
        int weight = nodesData[baseIndex + 2];
        int lock = nodesData[baseIndex + 3];

        // Logge die Werte
        std::cout << "Key: " << key << ", Color: " << color << ", Weight: " << weight << ", Lock: " << lock << std::endl;
    }
}

extern "C"
{
    void processGraph(int32_t *nodesData, int nodeCount, int32_t *linksData, int linkCount, int terms, int numThreads)
    {
        std::cout << "in process graph" << std::endl;
        // Umwandlung der Rohdaten in Vektoren von Strukturen
        std::vector<Node> nodes;
        std::vector<Link> links(linkCount);

        for (int i = 0; i < nodeCount; ++i)
        {
            nodes.emplace_back(nodesData[i * 4], nodesData[i * 4 + 1], nodesData[i * 4 + 2], nodesData[i * 4 + 3]);
        }

        for (int i = 0; i < linkCount; ++i)
        {
            links[i] = {linksData[i * 2], linksData[i * 2 + 1]};
        }
        invokeThreads(numThreads, nodes, links, terms);

    }
}
