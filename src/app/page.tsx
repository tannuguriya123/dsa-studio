// src/app/page.tsx
import Link from "next/link";
import { DSA_TOPICS } from "@/lib/dsa/core/codeSnippets";
import { TopicId } from "@/lib/dsa/core/types";

export default function HomePage() {
  const topics = Object.values(DSA_TOPICS);

  return (
    <main className="studio-page">
      <header className="studio-hero">
        <span className="studio-kicker">
          <span className="studio-kicker-dot" />
          Real execution engine
        </span>
        <h1 className="studio-title">
          Understand algorithms.<span className="studio-title-accent"> See every step.</span>
        </h1>
        <p className="studio-description">
          Inspect live pointer addresses, heap allocations, call stacks, tree rotations/deletions, and
          algorithms synchronized line-by-line across TypeScript, C++, Java, and Python.
        </p>
      </header>

      <section className="topic-grid" aria-label="Data structure topics">
        {topics.map((topic) => (
          <Link
            key={topic.id as TopicId}
            href={`/playground/${topic.id}`}
            className="topic-card"
          >
            <div className="space-y-2">
              <div className="topic-card-header">
                <span className="topic-card-badge">{topic.badge}</span>
                <span>{topic.methods.length} methods</span>
              </div>
              <h2 className="topic-card-title">{topic.title}</h2>
              <p className="topic-card-description">{topic.subtitle}</p>
            </div>
            <div className="topic-card-footer">
              <span>Open playground</span>
              <span className="topic-card-arrow">→</span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}