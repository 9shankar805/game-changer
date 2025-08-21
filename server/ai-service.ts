// Free AI service using Hugging Face Inference API
export class AIDescriptionService {
  private static readonly HF_API_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';
  private static readonly FALLBACK_API_URL = 'https://api-inference.huggingface.co/models/google/flan-t5-base';

  static async generateProductDescription(
    productName: string,
    brand: string,
    category: string,
    features: string[]
  ): Promise<string> {
    const prompt = `
Please generate a well-structured and SEO-friendly product description using the following product details:

Product Name: ${productName}
Brand: ${brand}
Category: ${category}
Key Features:
${features.map((f, i) => `- ${f}`).join('\n')}

Organize the product description using the following sections:

1. **Overview**
Give a short, compelling summary of the product and its main appeal.

2. **Key Features**
Use a bulleted list to highlight the major selling points.

3. **Technical Specifications**
Clearly format any technical information like size, resolution, battery life, etc.

4. **Ideal For**
Mention what kind of users or situations the product is best suited for.

5. **Why Choose This Product**
(Optional) Add a closing section highlighting why this product is better than alternatives.

Keep the tone professional and customer-friendly. Use keywords like "${productName}", "${brand}", and any relevant phrases naturally.
`;

    try {
      // Try primary model first
      const response = await fetch(this.HF_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 1000,
            temperature: 0.7,
            do_sample: true,
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        return this.cleanupResponse(result[0]?.generated_text || this.getFallbackDescription(productName, brand, features));
      }

      // Fallback to simpler model
      const fallbackResponse = await fetch(this.FALLBACK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `Generate product description for ${productName} by ${brand}`,
          parameters: {
            max_length: 500,
          }
        })
      });

      if (fallbackResponse.ok) {
        const result = await fallbackResponse.json();
        return this.cleanupResponse(result[0]?.generated_text || this.getFallbackDescription(productName, brand, features));
      }

      // If all AI services fail, return structured fallback
      return this.getFallbackDescription(productName, brand, features);

    } catch (error) {
      console.error('AI description generation failed:', error);
      return this.getFallbackDescription(productName, brand, features);
    }
  }

  private static cleanupResponse(text: string): string {
    // Remove any unwanted prefixes or suffixes from AI responses
    return text
      .replace(/^(Human:|Assistant:|Bot:|AI:)/gi, '')
      .replace(/^\s*[\-\*]\s*/, '')
      .trim();
  }

  private static getFallbackDescription(productName: string, brand: string, features: string[]): string {
    return `## Overview
The ${productName} by ${brand} represents quality and innovation in its category, designed to meet your everyday needs with reliability and style.

## Key Features
${features.map(f => `• ${f}`).join('\n')}

## Technical Specifications
Please refer to the product specifications for detailed technical information including dimensions, compatibility, and performance metrics.

## Ideal For
Perfect for users seeking a reliable ${productName.toLowerCase()} that combines functionality with quality craftsmanship from ${brand}.

## Why Choose This Product
With ${brand}'s commitment to quality and the carefully selected features, this ${productName} offers excellent value and dependable performance for your needs.`;
  }
}