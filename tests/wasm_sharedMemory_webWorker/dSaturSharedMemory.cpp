#include <iostream>
#include <vector>
#include <algorithm>
#include <emscripten.h>
#include <emscripten/threading.h>

int32_t *globalNodesData;
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
    int color;
    int weight;
    int lock;
};
struct Link
{
    int from;
    int to;
};

// get node attribute
int getNodeAttribute(int nodeKey, int attributeIndex)
{
    int index = (nodeKey-1) * 4 + attributeIndex;
    // Liest den Wert atomar
    // return Atomics.load(nodeBufferView, index);
    return emscripten_atomic_load_u32((uint32_t *)globalNodesData + index);
}

// set node attribute
void setNodeAttribute(int nodeKey, int attributeIndex, int value)
{
    int index = (nodeKey-1) * 4 + attributeIndex;
    // Atomics.store(nodeBufferView, index, value);
    emscripten_atomic_store_u32((uint32_t *)globalNodesData + index, (uint32_t)value);
}

void fetchAddNodeAttribute(int nodeKey, int attributeIndex)
{
    int index = (nodeKey-1) * 4 + attributeIndex;
    int oldValue = getNodeAttribute(nodeKey, attributeIndex);
    oldValue = oldValue+1;
    // Atomics.store(nodeBufferView, index, value);
    emscripten_atomic_store_u32((uint32_t *)globalNodesData + index, (uint32_t)oldValue);
}

void fetchSubNodeAttribute(int nodeKey, int attributeIndex)
{
    int index = (nodeKey-1) * 4 + attributeIndex;
    int oldValue = getNodeAttribute(nodeKey, attributeIndex);
    oldValue = oldValue - 1;
    // Atomics.store(nodeBufferView, index, value);
    emscripten_atomic_store_u32((uint32_t *)globalNodesData + index, (uint32_t)oldValue);
}


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
        if (getNodeAttribute(currNode.key, 1) == 0 && getNodeAttribute(currNode.key, 3) == 0)
        { // Knoten noch nicht gefärbt
            int weight = getNodeAttribute(currNode.key, 2);
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

        if (targetNode != nullptr && getNodeAttribute(targetNode->key, 1) == 0)
        {
            fetchAddNodeAttribute(targetNode->key, 2);
        }
    }
}

void lockAdjacentNodes(Node &node, std::vector<Node> &nodes, const std::vector<Link> &links)
{
    fetchAddNodeAttribute(node.key, 3);
    for (const auto &link : links)
    {
        if (link.from == node.key || link.to == node.key)
        {
            int targetNodeKey = (link.from == node.key) ? link.to : link.from;
            auto targetNodeIter = std::find_if(nodes.begin(), nodes.end(), [targetNodeKey](const Node &n)
                                               { return n.key == targetNodeKey; });

            if (targetNodeIter != nodes.end())
            {
                fetchAddNodeAttribute(targetNodeIter->key, 3);
            }
        }
    }
}

void unlockAdjacentNodes(Node &node, std::vector<Node> &nodes, const std::vector<Link> &links)
{
    fetchSubNodeAttribute(node.key, 3);

    for (const auto &link : links)
    {
        if (link.from == node.key || link.to == node.key)
        {
            int targetNodeKey = (link.from == node.key) ? link.to : link.from;
            auto targetNodeIter = std::find_if(nodes.begin(), nodes.end(), [targetNodeKey](const Node &n)
                                               { return n.key == targetNodeKey; });

            if (targetNodeIter != nodes.end())
            {
                fetchSubNodeAttribute(targetNodeIter->key, 3);
            }
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

void dSatur(std::vector<Node> &nodes, std::vector<Link> &links, int terms,int threadId)
{
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
                    if (getNodeAttribute(targetNode.key, 1) == color)
                    {
                        adjacentColored = true;
                        break;
                    }
                }
            }
            if (adjacentColored)
                ++color;
        } while (adjacentColored);
        if (getNodeAttribute(node->key, 1) == 0)
        {
            if (getNodeAttribute(node->key, 3) == 0)
            {
                lockAdjacentNodes(*node, nodes, links);
                setNodeAttribute(node->key, 1, color);
                updateSaturation(node->key, color, nodes, links);
                calculatePiLeibniz(terms); // Simuliere Berechnungsaufwand
                unlockAdjacentNodes(*node, nodes, links);
                changeNodeColorJS(node->key, color, threadId);
            }
        }
        node = selectNode(nodes, links);
    }
}

// void serializeBackToInt32Array(std::vector<Node> &nodes, int32_t *nodesData)
// {
//     for (size_t i = 0; i < nodes.size(); ++i)
//     {
//         nodesData[i * 4] = nodes[i].key;
//         nodesData[i * 4 + 1] = nodes[i].color.load();
//         nodesData[i * 4 + 2] = nodes[i].weight.load();
//         nodesData[i * 4 + 3] = nodes[i].lock.load();
//     }
// }

// // Funktion, um die Vektorinhalte zu loggen:
// void logNodes(const std::vector<Node> &nodes)
// {
//     std::cout << "Nodes:" << std::endl;
//     for (const auto &node : nodes)
//     {
//         std::cout << "Key: " << node.key << ", Color: " << node.color << ", Weight: " << node.weight << ", Lock: " << node.lock << std::endl;
//     }
// }

// void logNodesFromIntArray(const int32_t *nodesData, int nodeCount)
// {
//     std::cout << "Nodes from Int32 Array:" << std::endl;
//     for (int i = 0; i < nodeCount; ++i)
//     {
//         // Berechne den Basisindex für den aktuellen Knoten im Array
//         int baseIndex = i * 4;

//         // Extrahiere die Werte für den aktuellen Knoten
//         int key = nodesData[baseIndex];
//         int color = nodesData[baseIndex + 1];
//         int weight = nodesData[baseIndex + 2];
//         int lock = nodesData[baseIndex + 3];

//         // Logge die Werte
//         std::cout << "Key: " << key << ", Color: " << color << ", Weight: " << weight << ", Lock: " << lock << std::endl;
//     }
// }

extern "C"
{
void processGraph(int nodesOffset, int nodeCount, int linksOffset, int linkCount, int terms, int threadId) {
        // Direkter Zugriff auf die Knoten und Verbindungen im Shared Memory
        int32_t* nodesData = reinterpret_cast<int32_t*>(nodesOffset);
        int32_t* linksData = reinterpret_cast<int32_t*>(linksOffset);
        globalNodesData = nodesData;
        std::vector<Node> nodes(nodeCount);
        std::vector<Link> links(linkCount);

        for (int i = 0; i < nodeCount; ++i)
        {
            nodes[i] = {nodesData[i * 4], nodesData[i * 4 + 1], nodesData[i * 4 + 2], nodesData[i * 4 + 3]};
        }

        for (int i = 0; i < linkCount; ++i)
        {
            links[i] = {linksData[i * 2], linksData[i * 2 + 1]};
        }
        dSatur(nodes, links, terms, threadId);
        threadsFinishedJS();
    }
}
