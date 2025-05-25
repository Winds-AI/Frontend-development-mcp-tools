# Future Plans for Frontend Development Tools MCP Extension

This document outlines the future direction and planned enhancements for the Frontend Development Tools MCP Extension. The goal is to further empower AI coding assistants by providing them with richer context and more intuitive tools, ultimately leading to more autonomous and efficient frontend development.

## Enhancing Tool Synergy and LLM Understanding

Currently, I have all the tools set up, but LLMs still struggle to understand how to use these tools together in sync with each other and code autonomously. For now, when I prompt, I give it instructions on how to do this separately. To overcome that, I have to update the names and descriptions of tools so that the LLM can understand that it can use these tools in conjunction with each other and other tools. This will make a huge difference.

## Automated Project Context Setup (Memories/Rules)

Next, I currently have to manually create memories in Windsurf and rules files in Cursor so that the AI has full context of the project. I plan to introduce a new tool that can utilize the agents of Windsurf to understand the structure of the project and then call this tool with some arguments.

My initial thought is that the Windsurf agent will locate all the necessary files like authentication context, API call structure setup, utilities and helpers, how the pages and routing are structured along with navigation, and then make a tool call with paths of these files as arguments. Then, this tool will make a dynamic prompt based on the project setup and return that prompt. Now, Windsurf's agent will take over again by understanding that prompt, and it will utilize its built-in tools to access those files and set up memories automatically. The main key will be how the prompt is set up.

*This will require a lot of Windsurf credits for researching and optimizing, so I am postponing this until I gather some money to spend on this one.*

## Advanced FRD Ingestion and Intelligent Retrieval

Another future set of tools that I plan to introduce are tools that ingest Functional Requirement Documents (FRDs) into a vector database by properly chunking them. We will be able to check its status, and the IDE agent can call this tool to understand what the requirements are and work accordingly.

An FRD is a complex and big document with a lot of interdependencies and a complex layout and structure, especially a poorly written FRD. So, I have some ideas on how to solve this by making an agent instead of simple semantic-based retrieval.

Initial thoughts are that this will either use Roaming RAG or an agent that can augment the query asked into multiple queries and keywords. This agent will have context of all the modules present in the FRD, so using this, it can craft queries that can identify potential interdependencies between my query and other modules present. This is to ensure that we don't miss any part from the FRD because of wordings and some expected interdependencies. There is a new research paper that I saw today that discusses reasoning RAG, and that will be useful here.

Now, the chunks of the FRD document will be smaller than we normally use, and I will retrieve, say, 3 chunks based on each query or keyword that we augmented. Then, I will remove the duplicate chunks and return unique chunks back. If the IDE's agent is using a reasoning agent, that can work on top of this, hence providing better overall output.

*This also requires a lot of credits and an API key to create the agent, so I have to postpone this also.*

---

I believe these future enhancements will significantly improve the capabilities of AI-assisted frontend development.

Guys, please suggest more cost-friendly ideas😭 so that I can work on those.


