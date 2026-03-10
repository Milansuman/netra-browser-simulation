## Multi-turn Evals

### Goal Fulfillment
**Measures how effectively the assistant helped achieve the scenario’s intended goal.**

This evaluator reviews the full conversation to determine whether the assistant understood the user’s objective and drove the interaction toward completing it. The final score reflects overall success in reaching the goal given the scenario context and how the conversation ended.

**Inputs**
- **Goal** – From the `scenario` field in the dataset  
- **Persona** – From the `persona` field in the dataset  
- **Human Info** – From the user data fields in the dataset  
- **Behavior Instructions** – From the simulated user behavior field in the dataset  
- **Conversation** – Conversation array from the test run  
- **Exit Reason** – Reason the conversation ended in the test run  

**Output**
- **Score (0–1):** Overall degree of goal achievement  
- **Reason:** Explanation summarizing why the goal was or wasn’t achieved  

**Limitations**
- Does not verify whether the goal itself was well-defined or realistic  
- Does not judge tone, style, or factual correctness independently  


---

### Guideline Adherence
**Measures whether the assistant followed its assigned instructions and constraints.**

This evaluator checks the conversation for alignment with the rules and boundaries defined when the evaluation was created. The score reflects how consistently the assistant stayed within those expectations across the interaction.

**Inputs**
- **Assistant Instructions** – Provided when the evaluator is created  
- **Assistant Constraints** – Provided when the evaluator is created  
- **Conversation** – Conversation array from the test run  

**Output**
- **Score (0–1):** Consistency of instruction and constraint compliance  
- **Reason:** Explanation highlighting adherence or violations  

**Limitations**
- Does not assess task success or user satisfaction  
- Does not account for missing, ambiguous, or conflicting instructions  


---

### Conversation Memory
**Measures how well the assistant remembers and uses earlier information.**

This evaluator looks at whether the assistant correctly acknowledges, retains, and applies information shared earlier in the conversation. The score reflects how consistently prior context is carried forward without unnecessary repetition.

**Inputs**
- **Conversation** – Conversation array from the test run  

**Output**
- **Score (0–1):** Effectiveness of memory usage  
- **Reason:** Explanation of correct recall or memory gaps  

**Limitations**
- Does not evaluate long-term memory across separate conversations  
- Does not judge whether the remembered information was important or useful  


---

### Conversation Completeness
**Measures whether the assistant fully addressed the user’s request.**

This evaluator checks if all required steps, follow-ups, and outcomes implied by the scenario were handled within the conversation. The score reflects how thoroughly the assistant carried the interaction to a meaningful conclusion.

**Inputs**
- **Goal** – From the `scenario` field in the dataset  
- **Persona** – From the `persona` field in the dataset  
- **Conversation** – Conversation array from the test run  

**Output**
- **Score (0–1):** Degree of task completeness  
- **Reason:** Explanation of what was completed or left unfinished  

**Limitations**
- Does not determine whether additional steps outside the conversation were needed  
- Does not assess response quality beyond coverage and completion  


---

### Conversation Flow
**Measures the clarity and coherence of the conversation.**

This evaluator examines whether the interaction progresses logically without contradictions or broken threads. The score reflects how easy the conversation is to follow from start to finish.

**Inputs**
- **Conversation** – Conversation array from the test run  
- **Exit Reason** – Reason the conversation ended in the test run  

**Output**
- **Score (0–1):** Quality of conversational structure  
- **Reason:** Explanation of flow issues or strengths  

**Limitations**
- Does not evaluate politeness, tone, or writing style  
- Does not judge whether the outcome was correct or successful  


---

### Factual Accuracy
**Measures whether the assistant’s responses align with the provided facts.**

This evaluator checks the conversation for contradictions, fabrications, or imprecise statements relative to the supplied reference information. The score reflects how reliably facts were used when they were relevant.

**Inputs**
- **Reference Facts** – Provided when the evaluator is added to the dataset  
- **Conversation** – Conversation array from the test run  

**Output**
- **Score (0–1):** Accuracy of factual statements  
- **Reason:** Explanation of correct or incorrect factual usage  

**Limitations**
- Does not verify facts beyond the provided reference information  
- Does not assess reasoning quality or interpretive judgments  


---

### Profile Utilization
**Measures how effectively the assistant used available user profile information.**

This evaluator determines whether relevant user data was correctly identified and applied to move the conversation forward. The score reflects appropriate and timely use of profile context.

**Inputs**
- **Human Info** – User data provided when creating the scenario  
- **Conversation** – Conversation array from the test run  

**Output**
- **Score (0–1):** Effectiveness of profile usage  
- **Reason:** Explanation of effective or missed use of profile information  

**Limitations**
- Does not assess whether the profile data itself is accurate or complete  
- Does not penalize the assistant when profile information is not applicable  


---

### Information Elicitation
**Measures how well the assistant gathered the information needed to proceed.**

This evaluator checks whether the assistant identified required inputs and requested them during the conversation. The score reflects completeness and appropriateness of information collection.

**Inputs**
- **Goal** – From the `scenario` field in the dataset  
- **Human Info** – User data provided when creating the scenario  
- **Conversation** – Conversation array from the test run  

**Output**
- **Score (0–1):** Effectiveness of information gathering  
- **Reason:** Explanation of missing, redundant, or well-timed questions  

**Limitations**
- Does not judge whether collected information led to a correct decision  
- Does not evaluate the phrasing or tone of the questions  