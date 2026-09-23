import { ACADEMY_LESSONS, GLOSSARY } from "../../../lib/academy";
import { t } from "../../../lib/i18n";
import { useConsole } from "../context";

export default function AcademyView() {
  const { academyDone, locale, openLessonId, setOpenLessonId, setView, toggleLessonDone } = useConsole();

  return (
    <section className="panel academy-panel">
      <div className="panel-heading"><div><span>{t("academy.kicker", locale)}</span><h2>{t("academy.title", locale)}</h2></div><span className="selection-count">{t("academy.progress", locale)} {academyDone.length}/{ACADEMY_LESSONS.length}</span></div>
      <p className="academy-subtitle">{t("academy.subtitle", locale)}</p>
      <div className="academy-welcome">
        <h3>{t("welcome.title", locale)}</h3>
        <ul>
          <li>{t("welcome.pathAcademy", locale)}</li>
          <li><button className="inline-link" onClick={() => setView("tutorial")}>{t("welcome.pathTutorial", locale)}</button></li>
          <li><button className="inline-link" onClick={() => setView("prep")}>{t("welcome.pathPro", locale)}</button></li>
        </ul>
      </div>
      <div className="academy-lessons">
        {ACADEMY_LESSONS.map((lesson, index) => {
          const open = openLessonId === lesson.id;
          const done = academyDone.includes(lesson.id);
          return (
            <article key={lesson.id} className={`academy-lesson ${done ? "done" : ""} ${open ? "open" : ""}`}>
              <button className="academy-lesson-head" onClick={() => setOpenLessonId(open ? "" : lesson.id)}>
                <span className="lesson-no">{String(index + 1).padStart(2, "0")}</span>
                <span className="lesson-title">{lesson.title[locale]}</span>
                <span className="lesson-meta">{done ? `✓ ${t("academy.done", locale)}` : `${lesson.minutes} min`}</span>
              </button>
              {open ? <div className="academy-lesson-body">
                <p className="lesson-goal">{lesson.goal[locale]}</p>
                {lesson.body.map((paragraph, at) => <p key={at}>{paragraph[locale]}</p>)}
                {lesson.points?.length ? <ul>{lesson.points.map((point, at) => <li key={at}>{point[locale]}</li>)}</ul> : null}
                <div className="lesson-actions">
                  {lesson.tryIt ? <button className="primary-button" onClick={() => setView(lesson.tryIt!.view)}>{lesson.tryIt.label[locale]}</button> : null}
                  <button className="ghost-button" onClick={() => toggleLessonDone(lesson.id)}>{done ? t("academy.markUndone", locale) : t("academy.markDone", locale)}</button>
                </div>
              </div> : null}
            </article>
          );
        })}
      </div>
      <div className="academy-glossary">
        <h3>{t("academy.glossary", locale)}</h3>
        <p>{t("academy.glossaryNote", locale)}</p>
        <div className="glossary-table" role="table">
          <div className="glossary-row glossary-head" role="row"><span>中文</span><span>English</span><span>日本語</span></div>
          {GLOSSARY.map((entry) => <div className="glossary-row" role="row" key={entry.zh}><span>{entry.zh}</span><span>{entry.en}</span><span>{entry.ja}</span></div>)}
        </div>
      </div>
    </section>
  );
}
