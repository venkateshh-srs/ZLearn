const generateNewSubtopics = (topicName) => {
  const updatedCourseTopics = {
    "Machine Learning": [
      {
        id: "1",
        name: "Machine Learning Overview",
        subtopics: [
          { id: "1.1", name: "Definition and Scope" },
          { id: "1.2", name: "Significance in Modern Tech" },
          { id: "1.3", name: "Evolution and Milestones" },
          { id: "1.4", name: "Types of Machine Learning" },
        ],
      },
      {
        id: "2",
        name: "Essential Concepts",
        subtopics: [
          { id: "2.1", name: "Key Algorithms and Approaches" },
          { id: "2.2", name: "Terminology and Frameworks" },
          { id: "2.3", name: "Model Training and Evaluation" },
          { id: "2.4", name: "Overfitting & Underfitting" },
        ],
      },
      {
        id: "3",
        name: "Applications in Practice",
        subtopics: [
          { id: "3.1", name: "Industry Use Cases" },
          { id: "3.2", name: "Popular Libraries & Tools (Scikit, TensorFlow)" },
          { id: "3.3", name: "Deployment Considerations" },
        ],
      },
      {
        id: "4",
        name: "Advanced Paradigms",
        subtopics: [
          { id: "4.1", name: "Deep Learning Architectures" },
          { id: "4.2", name: "Reinforcement Learning Techniques" },
          { id: "4.3", name: "Unsupervised & Semi-supervised Learning" },
        ],
      },
    ],
    "Data Science": [
      {
        id: "1",
        name: "Introduction to Data Science",
        subtopics: [
          { id: "1.1", name: "Understanding Data Science" },
          { id: "1.2", name: "CRISP-DM & Workflow Models" },
          { id: "1.3", name: "Data Types and Acquisition" },
          { id: "1.4", name: "Comparing DS, BI, and Analytics" },
          { id: "1.5", name: "Configuring Your Tooling Stack" },
        ],
      },
      {
        id: "2",
        name: "Mathematics & Statistics Essentials",
        subtopics: [
          { id: "2.1", name: "Matrix Operations and Vectors" },
          { id: "2.2", name: "Basic to Intermediate Probability" },
          { id: "2.3", name: "Descriptive & Inferential Statistics" },
          { id: "2.4", name: "Distributions and Hypothesis Testing" },
        ],
      },
    ],
    "React Development": [
      {
        id: "1",
        name: "React Fundamentals",
        subtopics: [
          { id: "1.1", name: "React at a Glance" },
          { id: "1.2", name: "Creating a React App (CRA, Vite)" },
          { id: "1.3", name: "JSX and Virtual DOM" },
          { id: "1.4", name: "Developer Tools & Debugging" },
        ],
      },
      {
        id: "2",
        name: "React Building Blocks",
        subtopics: [
          { id: "2.1", name: "Props and Functional Components" },
          { id: "2.2", name: "Managing State & Lifecycle" },
          { id: "2.3", name: "Event Handling and Binding" },
          { id: "2.4", name: "Conditional Rendering & Lists" },
        ],
      },
      {
        id: "3",
        name: "React Advanced Features",
        subtopics: [
          { id: "3.1", name: "Hooks Deep Dive (useState, useEffect, etc.)" },
          { id: "3.2", name: "Context and Global State" },
          { id: "3.3", name: "Navigation with React Router" },
          { id: "3.4", name: "Performance Optimization" },
        ],
      },
    ],
    "Digital Marketing": [
      {
        id: "1",
        name: "Digital Marketing Overview",
        subtopics: [
          { id: "1.1", name: "Defining Digital Marketing" },
          { id: "1.2", name: "Digital Channel Landscape" },
          { id: "1.3", name: "Inbound vs. Outbound Strategy" },
          { id: "1.4", name: "B2B vs B2C Approaches" },
        ],
      },
      {
        id: "2",
        name: "Marketing Disciplines",
        subtopics: [
          { id: "2.1", name: "Search Engine Optimization (SEO)" },
          { id: "2.2", name: "Paid Advertising (SEM, Google Ads)" },
          { id: "2.3", name: "Email & Automation Marketing" },
          { id: "2.4", name: "Content Strategy & Blogging" },
          { id: "2.5", name: "Analytics and KPIs" },
        ],
      },
    ],
    Photography: [
      {
        id: "1",
        name: "Camera & Technical Essentials",
        subtopics: [
          { id: "1.1", name: "Camera Types and Features" },
          { id: "1.2", name: "Mastering the Exposure Triangle" },
          { id: "1.3", name: "Understanding Lenses and Focal Lengths" },
          { id: "1.4", name: "White Balance and ISO Control" },
        ],
      },
      {
        id: "2",
        name: "Creative and Post-Processing Techniques",
        subtopics: [
          { id: "2.1", name: "Framing and Composition Rules" },
          { id: "2.2", name: "Light: Natural and Artificial" },
          { id: "2.3", name: "Photo Editing Software Overview" },
          { id: "2.4", name: "Color Correction and Retouching" },
        ],
      },
    ],
    "Calculus & Mathematics": [
      {
        id: "1",
        name: "Mathematical Foundations",
        subtopics: [
          { id: "1.1", name: "Algebra Refresher" },
          { id: "1.2", name: "Functions, Graphs, and Transformations" },
          { id: "1.3", name: "Concept of Limits and Continuity" },
          { id: "1.4", name: "Sequences and Series Basics" },
        ],
      },
      {
        id: "2",
        name: "Core Calculus Principles",
        subtopics: [
          { id: "2.1", name: "Derivatives and Their Applications" },
          { id: "2.2", name: "Integration Techniques and Areas" },
          { id: "2.3", name: "Real-World Problem Solving" },
          { id: "2.4", name: "Multivariable Calculus Basics" },
        ],
      },
    ],
    Angular: [
      {
        id: "1",
        name: "Introduction to Angular",
        subtopics: [
          { id: "1.1", name: "What is Angular and Why Use It?" },
          { id: "1.2", name: "Using Angular CLI and Workspaces" },
          { id: "1.3", name: "File and Folder Structure Explained" },
          { id: "1.4", name: "TypeScript for Angular" },
        ],
      },
      {
        id: "2",
        name: "Angular Core Mechanics",
        subtopics: [
          { id: "2.1", name: "Component Architecture" },
          { id: "2.2", name: "Template Syntax and Bindings" },
          { id: "2.3", name: "Services, Providers, and DI" },
          { id: "2.4", name: "Pipes and Forms" },
        ],
      },
      {
        id: "3",
        name: "Advanced Angular Features",
        subtopics: [
          { id: "3.1", name: "Routing and Navigation Guards" },
          { id: "3.2", name: "State Management with NgRx" },
          { id: "3.3", name: "Unit Testing & E2E Testing" },
          { id: "3.4", name: "Lazy Loading & Module Optimization" },
        ],
      },
    ],
  };

  return updatedCourseTopics[topicName] || [];
};

export default generateNewSubtopics;
