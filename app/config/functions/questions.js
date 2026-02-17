// API functions for questions

// Check if questions exist for a project
export const checkQuestionsExist = async (projectId) => {
  try {
    const response = await fetch(`/api/questions/${projectId}/check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to check questions');
    }
    
    const data = await response.json();
    return data.data?.questionsExist || false;
  } catch (error) {
    console.error('Error checking questions:', error);
    return false;
  }
};

// Initialize questions for a project
export const initializeQuestions = async (projectId, projectType = 'wordpress') => {
  try {
    const response = await fetch('/api/questions/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId, projectType }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to initialize questions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error initializing questions:', error);
    throw error;
  }
};

// Get project questions with answers
export const getProjectQuestions = async (projectId) => {
  try {
    const response = await fetch(`/api/projects/${projectId}/questions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch questions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

// Update answers
export const updateAnswers = async (projectId, answers) => {
  try {
    const response = await fetch(`/api/projects/${projectId}/answers`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update answers');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating answers:', error);
    throw error;
  }
};

// Get questions progress
export const getQuestionsProgress = async (projectId) => {
  try {
    const response = await fetch(`/api/questions/${projectId}/progress`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch progress');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching progress:', error);
    throw error;
  }
};

// Get question definitions
export const getQuestionDefinitions = async (projectType = 'wordpress') => {
  try {
    const response = await fetch(`/api/questions/definitions?projectType=${projectType}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch definitions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching definitions:', error);
    throw error;
  }
};

// Get answers as flat object
export const getAnswers = async (projectId) => {
  try {
    const response = await fetch(`/api/questions/${projectId}/answers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch answers');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching answers:', error);
    throw error;
  }
};