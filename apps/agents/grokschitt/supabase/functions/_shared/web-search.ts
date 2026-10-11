// Web search tool for GROK-MAX
export async function performWebSearch(query: string): Promise<any> {
  try {
    // Using DuckDuckGo Instant Answer API (no auth required)
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    );

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const data = await response.json();
    
    return {
      success: true,
      query,
      abstract: data.Abstract || 'No summary available',
      url: data.AbstractURL || '',
      relatedTopics: data.RelatedTopics?.slice(0, 3).map((topic: any) => ({
        text: topic.Text,
        url: topic.FirstURL
      })) || []
    };
  } catch (error: any) {
    console.error('Web search error:', error);
    return {
      success: false,
      error: error.message,
      query
    };
  }
}
