import {
  User, Mail, Phone, Hash, Building2, BookOpen, Landmark, GraduationCap,
  AlignLeft, Type, FileUp, Calendar, CheckSquare, CircleDot, ChevronDown,
  Link2, Braces,
} from "lucide-react";
import type { FieldType } from "../../types/domain.js";

export const FIELD_TYPE_META: Record<FieldType, { label: string; icon: typeof User; hasOptions?: boolean; defaultLabel: string }> = {
  full_name: { label: "Full Name", icon: User, defaultLabel: "Full Name" },
  email: { label: "Email", icon: Mail, defaultLabel: "Email Address" },
  phone: { label: "Phone", icon: Phone, defaultLabel: "Phone Number" },
  matric_number: { label: "Matric Number", icon: Hash, defaultLabel: "Matric Number" },
  employee_id: { label: "Employee ID", icon: Hash, defaultLabel: "Employee ID" },
  department: { label: "Department", icon: Building2, defaultLabel: "Department" },
  course: { label: "Course", icon: BookOpen, defaultLabel: "Course" },
  organization: { label: "Organization", icon: Landmark, defaultLabel: "Organization" },
  level: { label: "Level", icon: GraduationCap, defaultLabel: "Level" },
  rich_text: { label: "Rich Text", icon: AlignLeft, defaultLabel: "Answer / Explanation" },
  file_upload: { label: "File Upload", icon: FileUp, defaultLabel: "Upload File" },
  short_text: { label: "Short Text", icon: Type, defaultLabel: "Short Answer" },
  long_text: { label: "Long Text", icon: AlignLeft, defaultLabel: "Long Answer" },
  number: { label: "Number", icon: Hash, defaultLabel: "Number" },
  date: { label: "Date", icon: Calendar, defaultLabel: "Date" },
  checkbox: { label: "Checkbox", icon: CheckSquare, hasOptions: true, defaultLabel: "Select all that apply" },
  radio: { label: "Radio", icon: CircleDot, hasOptions: true, defaultLabel: "Choose one" },
  dropdown: { label: "Dropdown", icon: ChevronDown, hasOptions: true, defaultLabel: "Choose one" },
  url: { label: "URL", icon: Link2, defaultLabel: "Website / URL" },
  custom: { label: "Custom", icon: Braces, defaultLabel: "Custom Field" },
};

export const FIELD_PALETTE_ORDER: FieldType[] = [
  "full_name", "email", "phone", "matric_number", "employee_id", "department",
  "course", "organization", "level", "short_text", "long_text", "rich_text",
  "number", "date", "url", "dropdown", "radio", "checkbox", "file_upload", "custom",
];
