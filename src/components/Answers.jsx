import { useEffect, useState } from "react";
import { checkHeading, replaceHeadingStarts } from "../helper";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";

const Answer = ({ ans, totalResult, index, type }) => {
  const [heading, setHeading] = useState(false);
  const [answer, setAnswer] = useState(ans);

  useEffect(() => {
    let processed = ans;

    // If heading syntax found
    if (checkHeading(ans)) {
      setHeading(true);
      processed = replaceHeadingStarts(ans);
    }

    // ✅ Detect code-like text and wrap safely
    const looksLikeCode = /for\s*\(|if\s*\(|while\s*\(|const\s+|let\s+|var\s+|function\s*\(|=>/.test(ans);
    if (looksLikeCode && !ans.includes("```")) {
      processed = `\`\`\`javascript\n${ans}\n\`\`\``;
    }

    setAnswer(processed);
  }, [ans]);

  const renderer = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          {...props}
          language={match[1]}
          style={dark}
          PreTag="div"
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <>
      {index === 0 && totalResult > 1 ? (
        <span className="pt-2 text-xl block text-white">
            {answer}</span>
      ) : heading ? (
        <span className="pt-2 text-lg block text-blue-400">
          <ReactMarkdown components={renderer}>{answer}</ReactMarkdown>
        </span>
      ) : (
        <span className={type === "q" ? "pl-1" : "pl-5"}>
          <ReactMarkdown components={renderer}>{answer}</ReactMarkdown>
        </span>
      )}
    </>
  );
};

export default Answer;
