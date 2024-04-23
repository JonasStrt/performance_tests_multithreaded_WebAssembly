#include <iostream>
#include <vector>
#include <algorithm>
#include <emscripten.h>
#include <cmath>
#include <iomanip>

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

double calculatePiLeibniz(int terms)
{
    volatile long double sum = 0.0;
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
    long double pi = 4 * sum;
    std::cout << "Pi berechnet mit " << terms << " Termen: "
              << std::setprecision(20) << pi << std::endl;
    return pi;
}

int dSaturSingleNode(int nodeKey, std::vector<Node> &nodes, std::vector<Link> &links, int terms)
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
    calculatePiLeibniz(terms + color);
    return color;
}

extern "C"
{
    int processNode(int nodeKey, int32_t *nodesData, int nodeCount, int32_t *linksData, int linkCount, int terms)
    {
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
        return dSaturSingleNode(nodeKey, nodes, links, terms);
    }
}
