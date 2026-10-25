use super::*;

#[test]
fn test_classify_urls() {
    let url = "https://i.chaoxing.com".parse().unwrap();
    assert_eq!(classify(&url), Type::MainSpace);

    let url = "https://mooc1.chaoxing.com/mycourse/...".parse().unwrap();
    assert_eq!(classify(&url), Type::Course);

    let url = "https://mooc1.chaoxing.com/visit/stucoursemiddle?courseid=1"
        .parse()
        .unwrap();
    assert_eq!(classify(&url), Type::Other);

    let url = "https://passport2.chaoxing.com/login?refer=https://www.chaoxing.com"
        .parse()
        .unwrap();
    assert_eq!(classify(&url), Type::Login);

    let url = "https://example.com".parse().unwrap();
    assert_eq!(classify(&url), Type::Unknown);

    let url = "https://mooc2-ans.chaoxing.com".parse().unwrap();
    assert_eq!(classify(&url), Type::CourseOverview);
}

#[test]
fn classifies_only_the_supported_homework_origin_and_path() {
    let path = "/mooc-ans/mooc2/work/dowork";
    let url = format!("https://mooc1-api.chaoxing.com{path}?workId=1&answerId=2");
    assert_eq!(classify(&url.parse().unwrap()), Type::Work);
    assert!(super::super::script::obtain(Type::Work).is_some());
    for url in [
        format!("https://mooc1.chaoxing.com{path}"),
        format!("https://mooc1-api.chaoxing.com{path}/extra"),
        "https://mooc1-api.chaoxing.com/mooc-ans/mooc2/work/prompt".into(),
        format!("https://mooc1-api.chaoxing.com.example.com{path}"),
    ] {
        assert_ne!(classify(&url.parse().unwrap()), Type::Work, "{url}");
    }
}

#[test]
fn classifies_exam_questions_and_whole_paper_preview() {
    for path in [
        "/exam-ans/exam/test/reVersionTestStartNew",
        "/mooc-ans/exam/test/reVersionTestStartNew",
        "/exam-ans/mooc2/exam/preview",
        "/mooc-ans/mooc2/exam/preview",
    ] {
        let url = format!("https://mooc1-api.chaoxing.com{path}?testId=1");
        assert_eq!(classify(&url.parse().unwrap()), Type::Exam, "{url}");
        let foreign = format!("https://example.com{path}");
        assert_eq!(classify(&foreign.parse().unwrap()), Type::Unknown);
        let extra = format!("https://mooc1-api.chaoxing.com{path}/extra");
        assert_ne!(classify(&extra.parse().unwrap()), Type::Exam);
    }
    assert!(super::super::script::obtain(Type::Exam).is_some());
}
