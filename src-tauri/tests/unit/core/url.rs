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
