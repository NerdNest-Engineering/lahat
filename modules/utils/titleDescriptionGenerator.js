import Anthropic from '@anthropic-ai/sdk';

/**
 * Generate a title and description based on user input
 * @param {string} input - User input describing what they want
 * @param {string} apiKey - Claude API key
 * @param {Function} onChunk - Callback for streaming updates
 * @returns {Promise<Object>} - Object containing title and description
 */
export async function generateTitleAndDescription(input, apiKey, onChunk) {
  const anthropic = new Anthropic({
    apiKey: apiKey
  });
  
  const prompt = `Based on the following user input, provide:
1. A concise, creative, and descriptive title (2-5 words)
2. An expanded description paragraph

For the description paragraph: Rephrase and expand the input into a single, self-contained paragraph that clearly defines the purpose and functionality of the mini-application. The response should be declarative, avoiding direct reference to the user and eliminating any additional explanations or commentary.

For example:
• Input: "I want Tetris."
  Title: "Block Cascade"
  Description: "A game application that replicates the classic mechanics of Tetris, where falling blocks must be arranged to form complete lines. The game features intuitive controls, real-time scoring, increasing difficulty levels, and smooth animations to enhance the gameplay experience."

• Input: "I need a spreadsheet."
  Title: "DataGrid Pro"
  Description: "A spreadsheet management tool that provides an efficient workspace for organizing and analyzing data, featuring customizable layouts, formula creation, and data visualization capabilities. It supports multiple file types, including Excel and CSV formats, with real-time updates and automatic data synchronization for seamless collaboration."

Format your response as:
TITLE: [your title here]
DESCRIPTION: [your description here]

User input: "${input}"`;

  // Call Claude API with streaming enabled
  const response = await anthropic.messages.create({
    model: 'claude-3-7-sonnet-20250219',
    max_tokens: 1000,
    messages: [
      { role: 'user', content: prompt }
    ],
    stream: true
  });

  let accumulatedContent = '';
  let title = '';
  let description = '';
  
  // Process the stream
  for await (const chunk of response) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      const text = chunk.delta.text || '';
      accumulatedContent += text;
      
      console.log('Received chunk:', text);
      
      // Try to extract title and description as they come in
      const titleMatch = accumulatedContent.match(/TITLE:\s*(.*?)(?:\n|$)/i);
      const descriptionMatch = accumulatedContent.match(/DESCRIPTION:\s*(.*)/is);
      
      const currentTitle = titleMatch ? titleMatch[1].trim() : "";
      const currentDescription = descriptionMatch ? descriptionMatch[1].trim() : "";
      
      // Always call onChunk with the current state to ensure UI updates
      // This ensures we're sending updates even if the title/description hasn't changed
      if (onChunk) {
        onChunk({
          title: currentTitle,
          description: currentDescription,
          done: false,
          content: text
        });
        
        // Add a larger delay to ensure the UI has time to update
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Update our local variables
      title = currentTitle;
      description = currentDescription;
    }
  }
  
  // Final parsing to ensure we have the complete title and description
  const titleMatch = accumulatedContent.match(/TITLE:\s*(.*?)(?:\n|$)/i);
  const descriptionMatch = accumulatedContent.match(/DESCRIPTION:\s*(.*)/is);
  
  title = titleMatch ? titleMatch[1].trim() : "Mini App";
  description = descriptionMatch ? descriptionMatch[1].trim() : accumulatedContent;
  
  // Signal completion
  if (onChunk) {
    onChunk({
      title,
      description,
      done: true
    });
  }
  
  return {
    title,
    description
  };
}
