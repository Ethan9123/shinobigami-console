import { FIELD_NAMES, SKILL_TABLE } from "../../lib/rules";

export const RANK_OPTIONS = ["下忍", "下忍头", "中忍", "中忍头", "上忍", "上忍头", "头领"];

/** 指定特技下拉：按分野分组，只列出候选特技。 */
export function SkillOptions({ choices }: { choices: string[] }) {
  return <>{FIELD_NAMES.map((field) => {
    const skills = SKILL_TABLE[field].filter((skill) => choices.includes(skill));
    return skills.length ? <optgroup label={field} key={field}>{skills.map((skill) => <option value={skill} key={skill}>{skill}</option>)}</optgroup> : null;
  })}</>;
}
