export const SAMPLES = [
  {
    label: 'Flowchart',
    code: `flowchart TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> B`,
  },
  {
    label: 'Sequence Diagram',
    code: `sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
    Alice-)John: See you later!`,
  },
  {
    label: 'Class Diagram',
    code: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal : +String name
    Animal : +swim()
    Duck : +quack()
    Fish : +swim()`,
  },
  {
    label: 'State Diagram',
    code: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`,
  },
  {
    label: 'ER Diagram',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER { string name string email }
    ORDER { int id date orderDate }`,
  },
  {
    label: 'Gantt',
    code: `gantt
    title Project Schedule
    dateFormat YYYY-MM-DD
    section Phase 1
    Task A :a1, 2024-01-01, 30d
    Task B :after a1, 20d
    section Phase 2
    Task C :2024-03-01, 15d`,
  },
  {
    label: 'Pie Chart',
    code: `pie title Pets Adopted
    "Dogs" : 386
    "Cats" : 85
    "Rabbits" : 15`,
  },
  {
    label: 'Mind Map',
    code: `mindmap
  root((Ideas))
    Origins
      History
      Research
    Tools
      Digital
      Analog`,
  },
  {
    label: 'Timeline',
    code: `timeline
    title History of Social Media
    2002 : LinkedIn
    2004 : Facebook
    2005 : YouTube
    2006 : Twitter`,
  },
  {
    label: 'Git Graph',
    code: `gitGraph
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit`,
  },
]
