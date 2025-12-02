'use client';

interface PyramidTextProps {
  text: string;
  className?: string;
}

export function PyramidText({ text, className = '' }: PyramidTextProps) {
  const words = text.split(' ');
  
  // Calculate lines to form an inverted pyramid
  const lines: string[] = [];
  let currentLine: string[] = [];
  let targetLength = Infinity; // Start with longest line
  let lineIndex = 0;
  
  // First pass: determine optimal line lengths for pyramid shape
  const totalChars = text.length;
  const estimatedLines = Math.ceil(Math.sqrt(words.length * 2));
  
  // Build lines with decreasing character counts
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = [...currentLine, word].join(' ');
    
    // Calculate target length for this line (decreasing)
    const targetForLine = Math.floor(totalChars / estimatedLines * (estimatedLines - lineIndex));
    
    if (currentLine.length > 0 && testLine.length > targetForLine && lineIndex < estimatedLines - 1) {
      // Finish current line and start new one
      lines.push(currentLine.join(' '));
      currentLine = [word];
      lineIndex++;
    } else {
      currentLine.push(word);
    }
  }
  
  // Add remaining words
  if (currentLine.length > 0) {
    lines.push(currentLine.join(' '));
  }
  
  // Sort lines by length (longest first) to ensure pyramid shape
  lines.sort((a, b) => b.length - a.length);
  
  return (
    <div className={className}>
      {lines.map((line, index) => (
        <div key={index} className="text-center">
          {line}
        </div>
      ))}
    </div>
  );
}
