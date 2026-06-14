from services.embedding_service import embed_texts


def _normalize(skill: str) -> str:
    return skill.strip().lower()


def exact_skill_match(resume_skills: list[str], jd_skills: list[str]) -> dict:
    normalized_resume = {_normalize(skill): skill for skill in resume_skills}
    normalized_jd = {_normalize(skill): skill for skill in jd_skills}

    matched_keys = normalized_jd.keys() & normalized_resume.keys()
    missing_keys = normalized_jd.keys() - normalized_resume.keys()

    matched = [normalized_jd[key] for key in sorted(matched_keys)]
    missing = [normalized_jd[key] for key in sorted(missing_keys)]

    score = 0 if not jd_skills else round((len(matched) / len(jd_skills)) * 100)

    return {
        "score": score,
        "matched": matched,
        "missing": missing,
        "semantic_matches": [],
    }


def semantic_skill_match(
    resume_skills: list[str],
    jd_skills: list[str],
    threshold: float,
) -> dict:
    if not jd_skills:
        return {
            "score": 0,
            "matched": [],
            "missing": [],
            "semantic_matches": [],
        }

    if not resume_skills:
        return {
            "score": 0,
            "matched": [],
            "missing": jd_skills,
            "semantic_matches": [],
        }

    resume_embeddings = embed_texts(resume_skills)
    jd_embeddings = embed_texts(jd_skills)

    matched: list[str] = []
    missing: list[str] = []
    semantic_matches: list[dict[str, str]] = []
    seen_jd: set[str] = set()

    for jd_index, jd_skill in enumerate(jd_skills):
        jd_norm = _normalize(jd_skill)
        resume_norm_map = {_normalize(skill): skill for skill in resume_skills}

        if jd_norm in resume_norm_map:
            matched.append(jd_skill)
            seen_jd.add(jd_norm)
            continue

        best_score = -1.0
        best_resume_skill = ""

        jd_vector = jd_embeddings[jd_index]
        for resume_index, resume_skill in enumerate(resume_skills):
            resume_vector = resume_embeddings[resume_index]
            dot = sum(left * right for left, right in zip(jd_vector, resume_vector))
            jd_norm_vec = sum(value * value for value in jd_vector) ** 0.5
            resume_norm_vec = sum(value * value for value in resume_vector) ** 0.5
            similarity = dot / (jd_norm_vec * resume_norm_vec) if jd_norm_vec and resume_norm_vec else 0.0

            if similarity > best_score:
                best_score = similarity
                best_resume_skill = resume_skill

        if best_score >= threshold:
            matched.append(jd_skill)
            seen_jd.add(jd_norm)
            semantic_matches.append(
                {
                    "jd_skill": jd_skill,
                    "resume_skill": best_resume_skill,
                    "similarity": f"{best_score:.2f}",
                }
            )
        else:
            missing.append(jd_skill)

    score = round((len(matched) / len(jd_skills)) * 100)

    return {
        "score": score,
        "matched": matched,
        "missing": missing,
        "semantic_matches": semantic_matches,
    }
