# FRD Searchable Tool - Solution Design

## Project Goal
Build a tool that takes FRD (Functional Requirements Document) documents and makes them searchable and explorable, focusing on reasoning and interconnectivity between modules.

## The Problem
- **Non-technical authors**: Clients write unclear, poorly structured requirements
- **Implicit relationships**: Connections between modules not explicitly stated  
- **Visual requirements**: Critical mockups and diagrams provide implementation details
- **Interconnectivity gaps**: Features depend on each other in non-obvious ways

**Example**: Client writes "Users can book appointments" but this actually requires:
- Customer booking interface (with mockups)
- Admin booking management system
- Category and pricing management
- Email notifications, calendar integration, payment processing
- All interconnected but not explicitly linked in FRD

## Solution: LLM-Driven Context Extraction + Full Document Analysis

### Core Concept
**Smart keyword delegation** + context extraction with full document reasoning - optimized for 40k token FRDs with coding agent intelligence.

### Why This Works Better
- **Semantic keyword selection**: LLM agent provides contextually relevant keywords based on project history and structure
- **No information loss**: Agent understands project context, chooses better keywords than simple text extraction
- **Complete context**: No information loss from chunking
- **Visual understanding**: (Future) Mockups clarify client intentions  
- **Relationship discovery**: LLM identifies implicit connections
- **Technical translation**: Converts business language to technical requirements

### Implementation Flow
```
1. Document Processing
   ├── Extract text content (40k tokens max)
   └── Validate document size and format

2. Agent-Driven Query Processing  
   ├── LLM agent analyzes user query + project context
   ├── Agent provides semantically relevant keywords
   ├── Find keyword locations in document text
   └── Extract context windows around keywords

3. LLM Analysis
   ├── Send full document text (40k tokens)
   ├── Include highlighted keyword contexts
   ├── Provide original query for context
   └── Generate comprehensive analysis with interconnections
```

### Key Innovation: Agent-Driven Keywords
**Traditional approach**: "How does booking work?" → crude text extraction → ["booking", "work", "does"]
**Our approach**: LLM agent considers:
- Project structure and existing codebase
- User's development history
- Technical context and patterns
- Provides: ["booking-flow", "reservation-system", "payment-integration", "admin-dashboard", "room-management"]

### Example Workflow
**User Query**: "How should the booking interface work?"

**Traditional Keyword Extraction**: 
- Simple text processing: ["booking", "interface", "work"]
- Misses semantic context and project-specific terminology

**Agent-Driven Approach**:
1. **Agent Analysis**: Considers project structure, existing components, user's development context
2. **Smart Keywords**: ["booking-workflow", "reservation-form", "payment-integration", "room-selection", "admin-booking-management", "notification-system"]  
3. **Context Extraction**: Find these keywords + surrounding context in FRD
4. **LLM Input**: Full document + highlighted contexts + original query
5. **Output**: Complete booking ecosystem analysis with all interconnected modules

### Benefits
- **Context-Aware**: Agent knows project structure and can choose relevant technical terms
- **Comprehensive**: Finds related modules that simple text matching would miss
- **Efficient**: Direct focus on what matters for the specific project
- **Accurate**: Semantic understanding vs. crude string matching

## Technical Stack

### MCP Tool Implementation ✅
- **Tool Name**: `analyzeFrdDocument`
- **Input**: Document path + LLM-provided keywords + user query
- **Processing**: Context extraction around semantic keywords
- **Output**: Full analysis prompt ready for LLM processing

### Workflow Integration
1. **User asks**: "How does booking work?"
2. **Agent determines**: Relevant keywords based on project context
3. **MCP tool**: Extracts contexts for those keywords from FRD
4. **Agent processes**: Full document + contexts for comprehensive analysis

### Benefits of MCP Approach
- **Agent Intelligence**: Keywords chosen with full project awareness
- **Separation of Concerns**: Tool handles document processing, agent handles reasoning
- **Flexibility**: Agent can adapt keyword strategy based on query type
- **Performance**: Focused context extraction, comprehensive analysis

### Success Metrics
1. **Accuracy**: Finds relevant sections + related visuals
2. **Completeness**: Captures interconnected modules from both text and images  
3. **Visual Understanding**: Interprets mockups and relates them to text
4. **Usability**: Non-technical users get comprehensive insights
5. **Performance**: <45 seconds for complex multimodal queries

## Next Steps
- [ ] **Build MVP**: Keyword extraction + full document LLM
- [ ] **Add Image Processing**: Extract and analyze mockups
- [ ] **Create Prompts**: Specialized templates for interconnectivity analysis
- [ ] **Build Interface**: Simple query input and response display
- [ ] **Test & Iterate**: Validate with real FRD documents

---
*Refined approach - June 15, 2025*
