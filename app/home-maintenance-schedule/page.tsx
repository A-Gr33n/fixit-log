import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home Maintenance Schedule UK | FixIt Log",
  description:
    "A practical UK home maintenance schedule. Find out what to check monthly, every few months and throughout the year to keep your home in good condition.",
};

const sections = [
  {
    title: "Every month",
    emoji: "📅",
    tasks: [
      "Test your smoke alarms and carbon monoxide alarms according to the manufacturer's instructions.",
      "Check under sinks, around taps and near toilets for signs of leaks.",
      "Look for damp, mould or excessive condensation.",
      "Check that extractor fans and ventilation are working properly.",
      "Review upcoming home maintenance and servicing reminders.",
    ],
  },
  {
    title: "Every 3 months",
    emoji: "🛠️",
    tasks: [
      "Inspect sealant around baths, showers and sinks for gaps or damage.",
      "Clean accessible extractor fan covers and ventilation grilles.",
      "Check windows and doors for sticking, damaged seals or draughts.",
      "Inspect visible pipework for corrosion, moisture or leaks.",
      "Review any outstanding repairs before they become bigger problems.",
    ],
  },
  {
    title: "Every 6 months",
    emoji: "🏡",
    tasks: [
      "Inspect gutters and downpipes from ground level for visible blockages or damage.",
      "Look for loose or damaged roof tiles from a safe position on the ground.",
      "Check exterior paintwork, timber and fencing for deterioration.",
      "Inspect patios, paths and steps for cracks or trip hazards.",
      "Check outdoor drains for leaves and debris where safely accessible.",
    ],
  },
  {
    title: "Every year",
    emoji: "🔧",
    tasks: [
      "Arrange an annual boiler service with a Gas Safe registered engineer if you have a gas boiler.",
      "Review your heating system's maintenance requirements.",
      "Check the condition of external walls, pointing and visible brickwork.",
      "Review your home insurance and important household documents.",
      "Check whether any warranties, servicing appointments or safety inspections are due.",
    ],
  },
  {
    title: "Spring",
    emoji: "🌷",
    tasks: [
      "Check for damage caused by winter weather.",
      "Inspect outdoor taps and exposed pipework.",
      "Check fencing, gates and garden structures.",
      "Look for signs of blocked drainage after heavy rain.",
      "Plan outdoor repairs and maintenance projects.",
    ],
  },
  {
    title: "Summer",
    emoji: "☀️",
    tasks: [
      "Inspect exterior woodwork and paintwork.",
      "Maintain decking, fences and garden structures where needed.",
      "Check patios and pathways for uneven surfaces.",
      "Look for signs of roof or gutter damage from ground level.",
      "Schedule repairs that are easier to complete in warmer weather.",
    ],
  },
  {
    title: "Autumn",
    emoji: "🍂",
    tasks: [
      "Clear fallen leaves from accessible drains and arrange safe gutter cleaning if needed.",
      "Check your heating before colder weather arrives.",
      "Look for draughts around windows and doors.",
      "Check outdoor lighting and slippery pathways.",
      "Review preparations for freezing temperatures.",
    ],
  },
  {
    title: "Winter",
    emoji: "❄️",
    tasks: [
      "Check exposed pipes for freezing risks.",
      "Monitor condensation and damp in colder rooms.",
      "Make sure heating and hot water are working correctly.",
      "Check for leaks after storms or heavy rainfall.",
      "Keep entrances and outdoor paths safe during icy weather.",
    ],
  },
];

export default function HomeMaintenanceSchedule() {
  return (
    <main className="checklistPage">
      <div className="checklistContainer">
        <Link href="/" className="checklistBack">
          ← Back to FixIt Log
        </Link>

        <header className="checklistHeader">
          <h1>Home Maintenance Schedule UK 🏡</h1>

          <p>
            Wondering what home maintenance needs doing and when?
            This practical schedule helps UK homeowners plan regular
            checks, seasonal jobs and annual servicing so important
            tasks are less likely to be forgotten.
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
          Safety note: This is a general guide, not a fixed
          schedule for every property. Follow manufacturers'
          instructions and applicable safety requirements.
          Use qualified professionals for gas, electrical
          and other specialist work. Never climb onto roofs
          or work at height without appropriate training
          and equipment.
        </p>

        <section className="checklistCTA">
          <h2>
            Keep your home maintenance on schedule 🔧
          </h2>

          <p>
            FixIt Log helps you organise household maintenance,
            track repairs, record costs and keep important
            receipts together — all in one place.
          </p>

          <Link href="/signup" className="checklistButton">
            Get started with FixIt Log for free →
          </Link>
        </section>
      </div>
    </main>
  );
}