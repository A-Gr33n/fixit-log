import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home Maintenance Checklist UK | FixIt Log",
  description:
    "A practical home maintenance checklist for UK homeowners. Discover monthly and seasonal tasks to help keep your home in good condition.",
};

const sections = [
  {
    title: "Monthly home maintenance checklist",
    emoji: "📅",
    tasks: [
      "Test your smoke and carbon monoxide alarms.",
      "Check under sinks and around taps for leaks.",
      "Look for damp, mould or condensation.",
      "Check extractor fans and ventilation.",
      "Review upcoming servicing and maintenance dates.",
    ],
  },
  {
    title: "Spring maintenance checklist",
    emoji: "🌷",
    tasks: [
      "Inspect gutters and downpipes for blockages.",
      "Check external walls and brickwork for visible damage.",
      "Inspect windows and doors for damaged seals.",
      "Check outdoor taps and pipework after winter.",
      "Tidy outdoor areas and inspect fencing.",
    ],
  },
  {
    title: "Summer maintenance checklist",
    emoji: "☀️",
    tasks: [
      "Inspect outdoor paintwork and timber.",
      "Check patios, paths and steps for damage.",
      "Look for signs of roof damage from the ground.",
      "Check garden drainage and outdoor taps.",
      "Plan repairs before colder weather arrives.",
    ],
  },
  {
    title: "Autumn maintenance checklist",
    emoji: "🍂",
    tasks: [
      "Clear fallen leaves from gutters and drains.",
      "Check your heating system before winter.",
      "Arrange boiler servicing with a Gas Safe registered engineer where applicable.",
      "Check windows and doors for draughts.",
      "Inspect outdoor lighting and pathways.",
    ],
  },
  {
    title: "Winter maintenance checklist",
    emoji: "❄️",
    tasks: [
      "Check exposed pipes for freezing risks.",
      "Keep an eye out for condensation and damp.",
      "Check heating and hot water are working properly.",
      "Inspect your home for leaks after heavy rain.",
      "Check outdoor paths for ice and slipping hazards.",
    ],
  },
];

export default function HomeMaintenanceChecklist() {
  return (
    <main className="checklistPage">
      <div className="checklistContainer">
        <Link href="/" className="checklistBack">
          ← Back to FixIt Log
        </Link>

        <header className="checklistHeader">
          <h1>Home Maintenance Checklist UK 🏡</h1>

          <p>
            Keeping your home in good condition is easier when
            you know what to check and when. Use this practical
            monthly and seasonal checklist to stay on top of
            household maintenance.
          </p>
        </header>

        <div className="checklistSections">
          {sections.map((section) => (
            <section
              key={section.title}
              className="checklistCard"
            >
              <h2>
                {section.emoji} {section.title}
              </h2>

              <ul>
                {section.tasks.map((task) => (
                  <li key={task}>
                    <span
                      className="checklistTick"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="checklistSafety">
          Safety note: Use qualified professionals for gas,
          electrical and other specialist work. Maintenance
          needs vary by property.
        </p>

        <section className="checklistCTA">
          <h2>
            Never forget a home maintenance job again 🔧
          </h2>

          <p>
            FixIt Log helps you organise maintenance jobs,
            track repairs, record costs and keep important
            receipts together.
          </p>

          <Link href="/signup" className="checklistButton">
            Get started with FixIt Log →
          </Link>
        </section>
      </div>
    </main>
  );
}
