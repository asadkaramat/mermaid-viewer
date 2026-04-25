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
  {
    label: 'Quadrant Chart',
    code: `quadrantChart
    title Reach and Engagement
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 Expand
    quadrant-2 Promote
    quadrant-3 Re-evaluate
    quadrant-4 Improve
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]`,
  },
  {
    label: 'XY Chart',
    code: `xychart-beta
    title "Monthly Revenue"
    x-axis [Jan, Feb, Mar, Apr, May, Jun]
    y-axis "Revenue ($K)" 0 --> 100
    bar [42, 55, 68, 75, 83, 91]
    line [42, 55, 68, 75, 83, 91]`,
  },
  {
    label: 'Kanban',
    code: `kanban
  Todo
    task1[Write tests]
    task2[Update docs]
  In Progress
    task3[Build feature]
    task4[Code review]
  Done
    task5[Project setup]
    task6[Define spec]`,
  },
  {
    label: 'User Journey',
    code: `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 3: Me`,
  },
]
