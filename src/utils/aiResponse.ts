import type { ChatMessage, FamilyLogCategory, MemberId } from "@/types";

type Response = Omit<ChatMessage, "id" | "role">;

export type ClassifiedFamilyLog = {
  category: FamilyLogCategory;
  memberId: MemberId;
  input: string;
};

function memberFrom(input: string): MemberId {
  const q = input.toLowerCase();
  if (/grandma|grandmother|savita/.test(q)) return "savita";
  if (/mum|mom|mother|neha/.test(q)) return "neha";
  if (/dad|father|rajiv/.test(q)) return "rajiv";
  return "arjun";
}

export function loggingResponseFor(input: string): { response: Response; log: ClassifiedFamilyLog } {
  const q = input.toLowerCase();
  const memberId = memberFrom(input);
  const category: FamilyLogCategory = /medication|medicine|tablet|dose|\bmeds\b|took his|took her/.test(q)
    ? "Medication"
    : /blood pressure|\bbp\b|glucose|weight|reading/.test(q)
      ? "Metric"
      : /completed|finished|did (his|her|the)|exercises done/.test(q)
        ? "Task completion"
        : /felt|feels|tired|pain|dizzy|unwell|symptom/.test(q)
          ? "Symptom"
          : "Note";
  const member = ({ arjun: "Arjun", rajiv: "Rajiv", neha: "Neha", savita: "Savita" })[memberId];
  const safety = category === "Symptom"
    ? "\n\nThis saves an observation only. Circle will not diagnose it or recommend treatment."
    : "";

  return {
    log: { category, memberId, input },
    response: {
      text: `I’ll classify this before saving:\n\nMember\n${member}\n\nType\n${category}\n\nEntry\n“${input}”${safety}\n\nConfirm to add it to the family timeline.`,
      actions: [{ label: "Confirm log", href: "confirm-family-log" }],
    },
  };
}

export function responseFor(input: string): Response {
  const q = input.toLowerCase();

  if (/emergency|chest pain|can.t breathe|suicid|unconscious/.test(q)) {
    return {
      text: "This could need urgent help. Call local emergency services now (000 in Australia or 112 in India), and stay with the person if it is safe. Circle cannot assess emergencies.",
      actions: [{ label: "Emergency guidance", href: "/settings/help" }],
    };
  }
  if (
    q.includes("family review") ||
    (q.includes("review") && q.includes("family") && q.includes("today")) ||
    (q.includes("needs") && q.includes("attention") && q.includes("family"))
  ) {
    return {
      text: "Here’s today’s family review, prioritised from your records and open tasks.\n\n1. Rajiv · Review this week\nHbA1c changed from 7.2% to 7.8%, while fasting glucose changed from 132 to 146 mg/dL since April. His evening blood-pressure reading is also due at 7:30 pm.\n\nNext step: log tonight’s reading, then prepare questions about the April-to-July change for his clinician or dietitian. Do not change medication without clinical advice.\n\n2. Savita · Act today\nHer mobility exercises are overdue. Her latest pain entry is 6/10, and home physiotherapy is booked for 14 July at 10:00 am.\n\nNext step: complete the gentle routine if it still matches her care plan, or reschedule it if she is uncomfortable.\n\nOn track\nNeha completed her morning medication, and the family has completed 2 of 4 Sunday check-ins. Circle is organising existing information here, not diagnosing anyone.",
      citations: [
        {
          title: "Comprehensive Diabetes Panel · 8 July 2026",
          recordId: "rajiv-diabetes-jul",
        },
        {
          title: "Diabetes Review · 10 April 2026",
          recordId: "rajiv-diabetes-apr",
        },
        {
          title: "Physiotherapy Assessment · 2 July 2026",
          recordId: "savita-physio-jul",
        },
      ],
      actions: [
        { label: "Review Rajiv’s report", href: "/record/rajiv-diabetes-jul" },
        { label: "Complete Savita’s exercises", href: "/tasks?focus=mobility" },
        { label: "Open today’s tasks", href: "/tasks" },
        { label: "View family goal", href: "/goals" },
      ],
    };
  }
  if (
    (q.includes("compare") || q.includes("changed")) &&
    (q.includes("glucose") || q.includes("dad") || q.includes("rajiv"))
  ) {
    return {
      text: "Rajiv’s latest results have increased since April.\n\nHbA1c\n7.2% → 7.8%\n\nFasting glucose\n132 → 146 mg/dL\n\nThis shows an upward change across both recorded values. Circle can help you prepare questions or organise a follow-up, but it does not diagnose or recommend medication changes.",
      citations: [
        {
          title: "Comprehensive Diabetes Panel · 8 July 2026",
          recordId: "rajiv-diabetes-jul",
        },
        {
          title: "Diabetes Review · 10 April 2026",
          recordId: "rajiv-diabetes-apr",
        },
      ],
      actions: [
        {
          label: "Prepare questions",
          href: "prompt:Prepare questions for Rajiv’s diabetes review",
        },
        { label: "View reports", href: "/record/rajiv-diabetes-jul" },
        { label: "Set reminder", href: "/quick-add/reminder" },
        { label: "Find dietitian", href: "/provider/rhea-malhotra" },
      ],
    };
  }
  if (
    q.includes("hindi") &&
    q.includes("dietitian") &&
    (q.includes("1,200") || q.includes("1200") || q.includes("dad"))
  ) {
    return {
      text: "Rhea Malhotra is the strongest match: a verified diabetes dietitian in Delhi, Hindi and English speaking, ₹899 online, with a 98% match for Rajiv. Her next evening slot is tomorrow at 6:30 pm.",
      actions: [
        { label: "View Rhea’s profile", href: "/provider/rhea-malhotra" },
        {
          label: "Book for Rajiv",
          href: "/booking/new?providerId=rhea-malhotra&memberId=rajiv",
        },
      ],
    };
  }
  if (
    q.includes("remind") &&
    (q.includes("blood pressure") || q.includes("bp"))
  ) {
    return {
      text: "I can create this local reminder:\n\nRajiv · Log blood pressure · Today at 7:30 pm\n\nConfirm below to add it to family tasks.",
      actions: [
        { label: "Confirm reminder", href: "confirm-reminder" },
        { label: "Change details", href: "/quick-add/reminder" },
      ],
    };
  }
  if (
    q.includes("medication") &&
    (q.includes("schedule") || q.includes("when"))
  ) {
    return {
      text: "Rajiv: Metformin 500 mg with breakfast and dinner, Telmisartan 40 mg every morning, and Atorvastatin 10 mg at night. Neha: Levothyroxine 75 mcg every morning and Vitamin D3 weekly. Savita’s current list is also available in Medications.",
      actions: [{ label: "Open medications", href: "/medications" }],
    };
  }
  if (q.includes("adherence")) {
    return {
      text: "This month Rajiv is at 86% medication adherence and Neha is at 93%. Rajiv’s July goal is at least 95%. Review missed doses supportively and without blame.",
      actions: [
        { label: "Medication overview", href: "/medications" },
        { label: "Rajiv’s goal", href: "/goals" },
      ],
    };
  }
  if (
    q.includes("booking") ||
    q.includes("appointment") ||
    q.includes("upcoming care")
  ) {
    return {
      text: "Upcoming: Savita’s home physiotherapy on 14 July; Neha’s online yoga introduction on 15 July; Rajiv’s online dietitian on 16 July; and Arjun’s online trainer introduction on 18 July.",
      actions: [{ label: "View Care", href: "/care" }],
    };
  }
  if (q.includes("goal")) {
    return {
      text: "July goals: Arjun 9/20 sleep nights, Rajiv 86% toward a 95% adherence goal, Neha 7/20 step days, Savita 6/20 mobility sessions, and the family 2/4 Sunday check-ins.",
      actions: [{ label: "Open goals", href: "/goals" }],
    };
  }
  if (
    q.includes("today") ||
    q.includes("overview") ||
    q.includes("family doing") ||
    q.includes("summar")
  ) {
    return {
      text: "Today’s focus is gentle and practical: Savita’s mobility exercises, Rajiv’s 7:30 pm blood pressure log, and Arjun preparing Rajiv’s glucose diary. Neha completed her morning medication.",
      actions: [
        { label: "Today’s tasks", href: "/tasks" },
        { label: "Family profiles", href: "/member/arjun" },
      ],
    };
  }
  if (q.includes("trend") || q.includes("steps") || q.includes("sleep")) {
    return {
      text: "I can show seeded trends for steps, sleep, heart rate, blood pressure, glucose, pain or adherence. Arjun’s latest sleep is 6h 48m and his activity is 8,420 steps.",
      actions: [
        { label: "Sleep trend", href: "/metric/arjun/sleep" },
        { label: "Family profiles", href: "/member/arjun" },
      ],
    };
  }
  if (q.includes("question")) {
    return {
      text: "Useful questions for the appointment:\n\n• What change matters most between April and July?\n• Could medicine timing, meals or activity affect these readings?\n• What home readings should we log, and how often?\n• When should the panel be repeated?",
      citations: [
        {
          title: "Comprehensive Diabetes Panel · 8 July 2026",
          recordId: "rajiv-diabetes-jul",
        },
        {
          title: "Diabetes Review · 10 April 2026",
          recordId: "rajiv-diabetes-apr",
        },
      ],
    };
  }
  if (q.includes("hindi") || q.includes("translate")) {
    return {
      text: q.includes("hinglish")
        ? "Aaj family ka focus simple hai: Savita ki mobility exercises, Rajiv ka 7:30 pm BP log, aur glucose diary ready karna."
        : "आज परिवार का ध्यान सविता की मोबिलिटी एक्सरसाइज़, राजीव के ब्लड प्रेशर लॉग और ग्लूकोज़ डायरी पर है।",
    };
  }
  if (q.includes("source") || q.includes("citation")) {
    return {
      text: "Circle’s answers use the Mehra family’s local records, medication schedule, tasks, goals and care bookings.",
      citations: [
        { title: "Family record vault" },
        { title: "Medication schedule" },
        { title: "July goals" },
      ],
    };
  }
  if (
    q.includes("find") ||
    q.includes("care professional") ||
    q.includes("physio")
  ) {
    return {
      text: "For Savita’s mobility needs, Arvind Nair is the top home-physiotherapy match. For Rajiv’s diabetes nutrition, Rhea Malhotra is the top match.",
      actions: [{ label: "Open Care matching", href: "/care?match=true" }],
    };
  }
  if (q.includes("report") || q.includes("explain")) {
    return {
      text: "Choose a report from the family vault and I’ll explain its extracted values and linked comparison in plain language, without diagnosing.",
      actions: [{ label: "Open record vault", href: "/records" }],
    };
  }
  if (q.includes("task") || q.includes("assign")) {
    return {
      text: "I can add and assign a local family task, including a time and note.",
      actions: [{ label: "Create family task", href: "/quick-add/task" }],
    };
  }
  return {
    text: "I can help with family summaries, reports, medications, metric trends, bookings, goals, reminders, tasks, care matching, translations and sources. Try naming a family member and what you want to understand.",
  };
}
