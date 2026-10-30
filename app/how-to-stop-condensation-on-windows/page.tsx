import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Stop Condensation on Windows UK | FixIt Log",
  description:
    "Learn how to reduce condensation on windows in UK homes. Discover common causes, practical prevention tips, whether dehumidifiers help and when to investigate damp.",
};

const sections = [
  {
    title: "Why does condensation form on windows?",
    emoji: "💧",
    tasks: [
      "Condensation forms when warm, moisture-filled air meets a colder surface, such as window glass.",
      "Everyday activities including cooking, showering and drying clothes indoors can increase moisture in the air.",
      "Condensation is often more noticeable during autumn and winter because windows tend to be colder.",
      "A little condensation does not always mean something is seriously wrong, but persistent moisture deserves attention.",
    ],
  },
  {
    title: "How to reduce condensation on windows",
    emoji: "🪟",
    tasks: [
      "Use extractor fans when cooking or showering, and allow them to run for the recommended time afterwards.",
      "Use suitable background ventilation, such as trickle vents where fitted, following the manufacturer's guidance.",
      "Keep lids on pans when cooking to reduce the amount of moisture released into the air.",
      "Avoid drying clothes indoors where possible. If you need to, use a well-ventilated space or a suitable dehumidifier.",
      "Maintain appropriate, consistent heating where practical to help prevent very cold indoor surfaces.",
      "Wipe away condensation and dry affected window frames and sills to prevent moisture from sitting on surfaces.",
    ],
  },
  {
    title: "Will a dehumidifier stop condensation?",
    emoji: "🌬️",
    tasks: [
      "A dehumidifier can help reduce indoor humidity and may lessen condensation on windows.",
      "It can be particularly useful when drying laundry indoors or managing moisture in poorly ventilated rooms.",
      "A dehumidifier may not solve the underlying problem if ventilation is inadequate or water is entering the property.",
      "Follow the appliance manufacturer's instructions and maintain the unit regularly.",
      "Consider using a hygrometer to monitor indoor humidity and identify patterns over time.",
    ],
  },
  {
    title: "Why is there condensation outside my windows?",
    emoji: "🌤️",
    tasks: [
      "Condensation on the outside of a window can occur when the outer glass surface is cooler than the surrounding outdoor air.",
      "External condensation can sometimes be seen on well-insulated double-glazed windows.",
      "It is usually temporary and often disappears as the temperature changes.",
      "Condensation trapped between the panes of a sealed double-glazed unit is different and may indicate a failed seal.",
    ],
  },
  {
    title: "When should you worry about damp or mould?",
    emoji: "⚠️",
    tasks: [
      "Watch for recurring mould, persistent damp patches, peeling paint or damage around windows.",
      "Investigate condensation that continues despite reasonable ventilation and moisture-control measures.",
      "Check for other possible causes of moisture, such as leaking pipes, damaged seals or rainwater entering the building.",
      "Avoid simply painting over mould or damp without addressing the cause.",
      "Seek advice from a suitable professional if damp or mould is persistent, widespread or difficult to explain.",
    ],
  },
  {
    title: "How to prevent condensation from returning",
    emoji: "🏡",
    tasks: [
      "Check windows and surrounding walls regularly during colder months.",
      "Keep extractor fans, vents and other ventilation systems clean and working properly.",
      "Note which rooms develop condensation and whether it happens after cooking, showering or drying clothes.",
      "Record recurring problems, repairs and any professional advice so you can spot patterns over time.",
      "Include window checks and ventilation maintenance in your regular home maintenance routine.",
    ],
  },
];

export default function CondensationOnWindowsGuide() {
  return (
    <main className="checklistPage">
      <div className="checklistContainer">
        <Link href="/" className="checklistBack">
          ← Back to FixIt Log
        </Link>

        <header className="checklistHeader">
          <h1>How to Stop Condensation on Windows in the UK 💧</h1>

          <p>
            Finding water on your windows every morning?
            Condensation is a common issue in UK homes,
            particularly during autumn and winter.
            This guide explains why it happens, how to
            reduce it and when it could be a sign of
            a bigger damp or ventilation problem.
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

        <section className="checklistCard">
          <h2>📋 Keep on top of home maintenance</h2>

          <p>
            Regular checks can help you notice condensation,
            damp and other household issues before they
            become bigger problems.
          </p>

          <p>
            Explore our{" "}
            <Link href="/home-maintenance-checklist">
              free Home Maintenance Checklist
            </Link>
            {" "}or plan your regular checks with our{" "}
            <Link href="/home-maintenance-schedule">
              UK Home Maintenance Schedule
            </Link>
            .
          </p>
        </section>

        <p className="checklistSafety">
          Safety note: This article provides general home
          maintenance information. Persistent damp or mould
          may have several causes and should be investigated
          appropriately. Do not block required ventilation
          openings. Use qualified professionals for specialist
          repairs or investigations where needed.
        </p>

        <section className="checklistCTA">
          <h2>
            Keep track of your home maintenance 🔧
          </h2>

          <p>
            FixIt Log helps you record household problems,
            organise repairs, track costs and keep important
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