Prompt for Component Refactoring
Context
I have a React component with many lines of code that needs to be refactored to improve maintainability and code reusability.
Instructions
Analyze this complete component and identify refactoring opportunities following these priorities:
1. Business Logic Extraction

Identify complex logic that can be extracted into custom hooks
Look for repeating state and effect patterns
Find calculations or data transformations that can be modularized
Suggest hooks for: form handling, API calls, validations, etc.

2. Reusable UI Components

Detect repetitive or similar JSX blocks
Identify UI elements that could be independent components
Look for repeating layout or structure patterns
Suggest components for: buttons, modals, lists, forms, cards, etc.

3. Utilities and Helpers

Find utility functions that can be extracted
Identify constants or configurations that should be in separate files
Look for reusable validations or data transformations

4. Refactor Structure
For each identified opportunity, provide:

What to extract: Clear description of the code to extract
Why: Specific benefit of the extraction
How: Code example of the new hook/component
Impact: Estimation of lines that would be reduced

5. Refactoring Order
Prioritize extractions by:

Greatest impact on line reduction
Greatest reusability potential
Improvement in readability and maintenance

Expected Response Format
markdown## Refactoring Analysis

### 🎯 Summary
- Current lines: ~600
- Estimated lines after: ~X
- Number of suggested files: X

### 🔧 Suggested Custom Hooks
1. **useFormLogic** (~50 lines extracted)
   - Extracts: validation logic and form state handling
   - Benefit: reusable in other forms
   
2. **useApiData** (~40 lines extracted)
   - Extracts: API calls and loading/error handling
   - Benefit: standard pattern for all API calls

### 🧩 Suggested UI Components
1. **ActionButton** (~30 lines extracted)
   - Extracts: buttons with loading and variants
   - Benefit: visual consistency across the app

### 🛠 Suggested Utilities
1. **validation.utils.js**
   - Extracts: validation functions
   - Benefit: reusable and independently testable

### 📋 Refactoring Plan
1. Step 1: Extract [most impactful hook/component]
2. Step 2: Extract [next priority]
...

Now analyze my component and provide the refactoring analysis following this format.