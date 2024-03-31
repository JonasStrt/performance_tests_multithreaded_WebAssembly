#include <iostream>
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
};
struct Link
{
    int from;
    int to;
};
int32_t *globalNodesData;
int32_t *globalLinksData;
int globalLinkCount;
int globalNodeCount;

std::vector<Node> nodes(100);
std::vector<Link> links(100);

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


int getLinkAttribute(int linkIndex, int attributeIndex)
{
    int index = linkIndex * 2 + attributeIndex;
    // Liest den Wert atomar
    // return Atomics.load(nodeBufferView, index);
    //return emscripten_atomic_load_u32((uint32_t *)globalLinksData + index);
    return globalLinksData[index];
    //return 0;
}


// get node attribute
int getNodeAttribute(int nodeKey, int attributeIndex)
{
    // std::cout << "index : " << nodeKey << std::endl;
    int index = (nodeKey - 1) * 4 + attributeIndex;
    // Liest den Wert atomar
    // return Atomics.load(nodeBufferView, index);
    //return emscripten_atomic_load_u32((uint32_t *)globalNodesData + index);
    return globalNodesData[index];
    //return 0;
}

// set node attribute
void setNodeAttribute(int nodeKey, int attributeIndex, int value)
{
    int index = (nodeKey - 1) * 4 + attributeIndex;
    // Atomics.store(nodeBufferView, index, value);
    //emscripten_atomic_store_u32((uint32_t *)globalNodesData + index, (uint32_t)value);
    globalNodesData[index] = value;
}

void fetchAddNodeAttribute(int nodeKey, int attributeIndex)
{
    int index = (nodeKey - 1) * 4 + attributeIndex;
    int oldValue = getNodeAttribute(nodeKey, attributeIndex);
    oldValue = oldValue +1;
    setNodeAttribute(nodeKey, attributeIndex, oldValue);
    // Führt die Addition atomar durch
    //emscripten_atomic_add_u32((uint32_t *)globalNodesData + index, 1);
}

void fetchSubNodeAttribute(int nodeKey, int attributeIndex)
{
    // std::cout << "index : " << nodeKey << std::endl;
    int index = (nodeKey - 1) * 4 + attributeIndex;
    // Führt die Subtraktion atomar durch
    //emscripten_atomic_sub_u32((uint32_t *)globalNodesData + index, 1);
        int oldValue = getNodeAttribute(nodeKey, attributeIndex);
    oldValue = oldValue -1;
    setNodeAttribute(nodeKey, attributeIndex,oldValue);
}

// int countLinksForNode(int nodeKey)
// {
//     int count = 0;
//     for (const auto &link : links)
//     {
//         if (link.from == nodeKey || link.to == nodeKey)
//         {
//             ++count;
//         }
//     }
//     return count;
// }

int countLinksForNode(int nodeKey)
{
    int count = 0;
    // Zugriff auf die Links im Speicher
    for (int i = 0; i < globalLinkCount; ++i)
    {
        // Berechnung des Indexes im globalen Datenarray
        int index = i * 2; // Jeder Link hat 2 int32_t-Werte: from und to
        int from = getLinkAttribute(index, 0);//globalLinksData[index];
        int to = getLinkAttribute(index, 1);//globalLinksData[index + 1];

        if (from == nodeKey || to == nodeKey)
        {
            ++count;
        }
    }
    return count;
}

// Wähle den Knoten für die Färbung aus
// Node *selectNode(std::vector<Node> &nodes, const std::vector<Link> &links)
// {
//     Node *nodeToColor = nullptr;
//     int maxWeight = std::numeric_limits<int>::min();
//     int maxLinkCount = std::numeric_limits<int>::min();

//     for (auto &currNode : nodes)
//     {
//         if (getNodeAttribute(currNode.key, 1) == 0 && getNodeAttribute(currNode.key, 3) == 0)
//         { // Knoten noch nicht gefärbt
//             int weight = getNodeAttribute(currNode.key, 2);
//             int linkCount = countLinksForNode(currNode.key);

//             if (weight > maxWeight || (weight == maxWeight && linkCount > maxLinkCount))
//             {
//                 nodeToColor = &currNode; // Aktualisiere den zu färbenden Knoten
//                 maxWeight = weight;
//                 maxLinkCount = linkCount;
//             }
//         }
//     }

//     return nodeToColor;
// }

int selectNodeKey()
{
    int nodeToColorKey = -1; // Verwende -1, um anzuzeigen, dass kein Knoten gefunden wurde
    int maxWeight = std::numeric_limits<int>::min();
    int maxLinkCount = std::numeric_limits<int>::min();

    for (int i = 0; i < globalNodeCount; ++i)
    {
        int nodeKey = i +1;
        //int nodeKey = getNodeAttribute(i,0);// globalNodesData[i * 4]; // Angenommen, der Key ist das erste Attribut eines Knotens
        if (getNodeAttribute(nodeKey, 1) == 0 && getNodeAttribute(nodeKey, 3) == 0) // Knoten noch nicht gefärbt
        { 
            int weight = getNodeAttribute(nodeKey, 2);
            int linkCount = countLinksForNode(nodeKey); // Angepasste countLinksForNode Funktion wird hier aufgerufen

            if (weight > maxWeight || (weight == maxWeight && linkCount > maxLinkCount))
            {
                nodeToColorKey = nodeKey; // Aktualisiere den Schlüssel des zu färbenden Knotens
                maxWeight = weight;
                maxLinkCount = linkCount;
            }
        }
    }

    return nodeToColorKey;
}

// Node *findNodeByKey(std::vector<Node> &nodes, int key)
// {
//     for (auto &node : nodes)
//     {
//         if (node.key == key)
//         {
//             return &node;
//         }
//     }
//     return nullptr;
// }

// void updateSaturation(int nodeKey, int color, std::vector<Node> &nodes, const std::vector<Link> &links)
// {
//     for (const auto &link : links)
//     {
//         Node *targetNode = nullptr;
//         if (link.from == nodeKey)
//         {
//             targetNode = findNodeByKey(nodes, link.to);
//         }
//         else if (link.to == nodeKey)
//         {
//             targetNode = findNodeByKey(nodes, link.from);
//         }

//         if (targetNode != nullptr && getNodeAttribute(targetNode->key, 1) == 0)
//         {
//             fetchAddNodeAttribute(targetNode->key, 2);
//         }
//     }
// }

void updateSaturation(int nodeKey, int color)
{
    for (int i = 0; i < globalLinkCount; ++i)
    {
        int fromKey = getLinkAttribute(i,0);//globalLinksData[i * 2]; // Angenommen, das erste Element jedes Links ist 'from'
        int toKey = getLinkAttribute(i,1);//globalLinksData[i * 2 + 1]; // Angenommen, das zweite Element jedes Links ist 'to'
        int targetNodeKey = -1;

        if (fromKey == nodeKey)
        {
            targetNodeKey = toKey;
        }
        else if (toKey == nodeKey)
        {
            targetNodeKey = fromKey;
        }

        if (targetNodeKey != -1 && getNodeAttribute(targetNodeKey, 1) == 0) // Überprüfung, ob der Knoten noch nicht gefärbt ist
        {
            fetchAddNodeAttribute(targetNodeKey, 2); // Erhöht den Wert des Attributes 2 für den Zielknoten
        }
    }
}

// void lockAdjacentNodes(Node &node, std::vector<Node> &nodes, const std::vector<Link> &links)
// {
//     fetchAddNodeAttribute(node.key, 3);
//     for (const auto &link : links)
//     {
//         if (link.from == node.key || link.to == node.key)
//         {
//             int targetNodeKey = (link.from == node.key) ? link.to : link.from;
//             auto targetNodeIter = std::find_if(nodes.begin(), nodes.end(), [targetNodeKey](const Node &n)
//                                                { return n.key == targetNodeKey; });

//             if (targetNodeIter != nodes.end())
//             {
//                 fetchAddNodeAttribute(targetNodeIter->key, 3);
//             }
//         }
//     }
// }

void lockAdjacentNodes(int nodeKey)
{
    fetchAddNodeAttribute(nodeKey, 3); // Setze den Lock für den gegebenen Knoten

    for (int i = 0; i < globalLinkCount; ++i)
    {
        int fromKey = getLinkAttribute(i,0);//globalLinksData[i * 2]; // 'from' des aktuellen Links
        int toKey = getLinkAttribute(i,1);//globalLinksData[i * 2 + 1]; // 'to' des aktuellen Links

        // Überprüfe, ob der aktuelle Link vom gegebenen Knoten ausgeht oder zu ihm führt
        if (fromKey == nodeKey || toKey == nodeKey)
        {
            // Bestimme den Zielknotenschlüssel
            int targetNodeKey = (fromKey == nodeKey) ? toKey : fromKey;

            // Erhöhe den Lock-Wert für den Zielknoten
            fetchAddNodeAttribute(targetNodeKey, 3);
        }
    }
}

// void unlockAdjacentNodes(Node &node, std::vector<Node> &nodes, const std::vector<Link> &links)
// {
//     fetchSubNodeAttribute(node.key, 3);

//     for (const auto &link : links)
//     {
//         if (link.from == node.key || link.to == node.key)
//         {
//             int targetNodeKey = (link.from == node.key) ? link.to : link.from;
//             auto targetNodeIter = std::find_if(nodes.begin(), nodes.end(), [targetNodeKey](const Node &n)
//                                                { return n.key == targetNodeKey; });

//             if (targetNodeIter != nodes.end())
//             {
//                 fetchSubNodeAttribute(targetNodeIter->key, 3);
//             }
//         }
//     }
// }

void unlockAdjacentNodes(int nodeKey)
{
    fetchSubNodeAttribute(nodeKey, 3); // Verringere den Lock für den gegebenen Knoten

    for (int i = 0; i < globalLinkCount; ++i)
    {
        int fromKey = getLinkAttribute(i,0);//globalLinksData[i * 2]; // 'from' des aktuellen Links
        int toKey = getLinkAttribute(i,1);//globalLinksData[i * 2 + 1]; // 'to' des aktuellen Links

        // Überprüfe, ob der aktuelle Link vom gegebenen Knoten ausgeht oder zu ihm führt
        if (fromKey == nodeKey || toKey == nodeKey)
        {
            // Bestimme den Zielknotenschlüssel
            int targetNodeKey = (fromKey == nodeKey) ? toKey : fromKey;

            // Verringere den Lock-Wert für den Zielknoten
            fetchSubNodeAttribute(targetNodeKey, 3);
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

// void dSatur(std::vector<Node> &nodes, std::vector<Link> &links, int terms, int threadId)
// {
//     // std::cout << "in thread" << threadId << "DSatur" << std::endl;
//     Node *node = selectNode(nodes, links);
//     while (node != nullptr)
//     {
//         int color = 1;
//         bool adjacentColored;
//         do
//         {
//             adjacentColored = false;
//             for (const auto &link : links)
//             {
//                 if (link.from == node->key || link.to == node->key)
//                 {
//                     auto &targetNode = (link.from == node->key) ? *std::find_if(nodes.begin(), nodes.end(), [&](const Node &n)
//                                                                                 { return n.key == link.to; })
//                                                                 : *std::find_if(nodes.begin(), nodes.end(), [&](const Node &n)
//                                                                                 { return n.key == link.from; });
//                     if (getNodeAttribute(targetNode.key, 1) == color)
//                     {
//                         adjacentColored = true;
//                         break;
//                     }
//                 }
//             }
//             if (adjacentColored)
//                 ++color;
//         } while (adjacentColored);
//         if (getNodeAttribute(node->key, 1) == 0)
//         {
//             if (getNodeAttribute(node->key, 3) == 0)
//             {
//                 lockAdjacentNodes(*node, nodes, links);
//                 setNodeAttribute(node->key, 1, color);
//                 updateSaturation(node->key, color, nodes, links);
//                 calculatePiLeibniz(terms); // Simuliere Berechnungsaufwand
//                 unlockAdjacentNodes(*node, nodes, links);
//                 changeNodeColorJS(node->key, color, threadId);
//             }
//         }
//         node = selectNode(nodes, links);
//     }
// }


void dSatur(int terms, int threadId)
{
    int nodeKey = selectNodeKey();
    while (nodeKey != -1) // Ein gültiger Knotenschlüssel ist gefunden worden
    {
        int color = 1;
        bool adjacentColored;
        do
        {
            adjacentColored = false;
            for (int i = 0; i < globalLinkCount; ++i)
            {
                int fromKey = getLinkAttribute(i,0);//globalLinksData[i * 2];
                int toKey = getLinkAttribute(i,1);//globalLinksData[i * 2 + 1];

                int targetNodeKey = (fromKey == nodeKey) ? toKey : (toKey == nodeKey ? fromKey : -1);
                if (targetNodeKey != -1 && getNodeAttribute(targetNodeKey, 1) == color) // Prüfe die Farbe des angrenzenden Knotens
                {
                    adjacentColored = true;
                    break;
                }
            }
            if (adjacentColored) ++color;
        } while (adjacentColored);

        if (getNodeAttribute(nodeKey, 1) == 0)
        {
            if (getNodeAttribute(nodeKey, 3) == 0) // Überprüfe, ob der Knoten nicht gesperrt ist
            {
                lockAdjacentNodes(nodeKey);
                setNodeAttribute(nodeKey, 1, color);
                updateSaturation(nodeKey, color);
                calculatePiLeibniz(terms);
                unlockAdjacentNodes(nodeKey);
                changeNodeColorJS(nodeKey, color, threadId); // Simuliere Berechnungsaufwand und ändere die Farbe
            }
        }
        nodeKey = selectNodeKey(); // Wähle den nächsten Knoten aus
    }
}

extern "C"
{
    void processGraph(int nodesOffset, int nodeCount, int linksOffset, int linkCount, int terms, int threadId)
    {
        // std::cout << "in thread" << threadId << "processGraph" << std::endl;
        int memoryBaseAddress = 0;
        int32_t nodesOffsetInBytes = nodesOffset * sizeof(int32_t);
        int32_t linksOffsetInBytes = linksOffset * sizeof(int32_t);
        int32_t *nodesData = reinterpret_cast<int32_t *>(memoryBaseAddress + nodesOffsetInBytes);
        int32_t *linksData = reinterpret_cast<int32_t *>(memoryBaseAddress + linksOffsetInBytes);
        // std::cout << nodesData << std::endl;
        globalNodeCount = nodeCount;
        globalLinkCount = linkCount;

        globalNodesData = nodesData;
        globalLinksData = linksData;

        dSatur(terms, threadId);

        threadsFinishedJS();
    }
}

extern "C"
{
    void initializeData(int nodesOffset, int nodeCount, int linksOffset, int linkCount, int terms, int threadId)
    {
        int memoryBaseAddress = 0;
        int32_t nodesOffsetInBytes = nodesOffset * sizeof(int32_t);
        int32_t linksOffsetInBytes = linksOffset * sizeof(int32_t);
        int32_t *nodesData = reinterpret_cast<int32_t *>(memoryBaseAddress + nodesOffsetInBytes);
        int32_t *linksData = reinterpret_cast<int32_t *>(memoryBaseAddress + linksOffsetInBytes);

        globalNodesData = nodesData;
        // std::vector<Node> nodes (nodeCount);
        // std::vector<Link> links(linkCount);
        // nodes.resize(nodeCount);
        // links.resize(linkCount);

        // for (int i = 0; i < nodeCount; ++i)
        // {
        //     nodes[i] = {nodesData[i * 4], nodesData[i * 4 + 1], nodesData[i * 4 + 2], nodesData[i * 4 + 3]};
        // }

        // for (int i = 0; i < linkCount; ++i)
        // {
        //     links[i] = {linksData[i * 2], linksData[i * 2 + 1]};
        // }
    }

    int32_t getNodesDataPtr()
    {
        // return reinterpret_cast<int32_t>(&nodes[0]);
        return 0;
    }

    int32_t getLinksDataPtr()
    {
        //return reinterpret_cast<int32_t>(&links[0]);
        return 0;
    }

    int32_t getDataPtr() 
    {
        return reinterpret_cast<uintptr_t>(globalNodesData);
    }
}