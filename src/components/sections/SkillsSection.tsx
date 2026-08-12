import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'

import type { SkillGroup } from '../../types/content'

export function SkillsSection({ groups }: { groups: SkillGroup[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  function selectTab(index: number) {
    setActiveIndex(index)
    tabRefs.current[index]?.focus()
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex = index
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % groups.length
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + groups.length) % groups.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = groups.length - 1
    else return
    event.preventDefault()
    selectTab(nextIndex)
  }

  return (
    <div className="skills-section">
      <div aria-label="Skill categories" className="skill-tabs" role="tablist">
        {groups.map((group, index) => (
          <button aria-controls={`skill-panel-${index}`} aria-selected={activeIndex === index} id={`skill-tab-${index}`} key={group.name} onClick={() => selectTab(index)} onKeyDown={(event) => onTabKeyDown(event, index)} ref={(node) => { tabRefs.current[index] = node }} role="tab" tabIndex={activeIndex === index ? 0 : -1} type="button">
            {group.name}
          </button>
        ))}
      </div>
      {groups.map((group, index) => (
        <div aria-labelledby={`skill-tab-${index}`} className="skill-panel" hidden={activeIndex !== index} id={`skill-panel-${index}`} key={group.name} role="tabpanel">
          <ul>
            {group.skills.map((skill, skillIndex) => (
              <li key={skill.name} style={{ '--item-index': skillIndex } as CSSProperties}>
                <strong>{skill.name}</strong>
                <span>{skill.tag}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
