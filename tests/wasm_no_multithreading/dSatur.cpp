#include <iostream>
#include <vector>
#include <algorithm>
#include <emscripten.h>

// Deklariert die JavaScript-Funktion
EM_JS(void, changeNodeColorJS, (int nodeKey, int newColorCode, int thread), {
    // Rufe die JavaScript-Funktion auf
    Module.changeNodeColor(nodeKey, newColorCode, thread);
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
        if (currNode.color == 0)
        { // Knoten noch nicht gefärbt
            int weight = currNode.weight;
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

void dSatur(std::vector<Node> &nodes, std::vector<Link> &links, int terms)
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
                    if (targetNode.color == color)
                    {
                        adjacentColored = true;
                        break;
                    }
                }
            }
            if (adjacentColored)
                ++color;
        } while (adjacentColored);

        calculatePiLeibniz(terms); // Simuliere Berechnungsaufwand
        node->color = color;
        updateSaturation(node->key, node->color, nodes, links);
        changeNodeColorJS(node->key, node->color, 0);
        node = selectNode(nodes, links);
    }
}

extern "C"
{
    void processGraph(int32_t *nodesData, int nodeCount, int32_t *linksData, int linkCount, int terms)
    {
        // Umwandlung der Rohdaten in Vektoren von Strukturen
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

        dSatur(nodes, links, terms);
    }
}
