use super::finish_download;
use anyhow::anyhow;
use tokio::sync::Mutex;

#[tokio::test]
async fn failed_download_releases_the_slot_for_retry() {
    let downloads = Mutex::new(None);
    let failed = tokio::spawn(async { Err(anyhow!("download or signature failure")) });
    *downloads.lock().await = Some(failed.abort_handle());
    assert!(finish_download(failed, &downloads).await.is_err());
    assert!(downloads.lock().await.is_none());

    let retry = tokio::spawn(async { Ok(()) });
    *downloads.lock().await = Some(retry.abort_handle());
    assert!(finish_download(retry, &downloads).await.unwrap());
    assert!(downloads.lock().await.is_none());
}

#[tokio::test]
async fn cancelled_download_does_not_clear_a_newer_download() {
    let downloads = Mutex::new(None);
    let cancelled = tokio::spawn(std::future::pending::<anyhow::Result<()>>());
    *downloads.lock().await = Some(cancelled.abort_handle());
    downloads.lock().await.take().unwrap().abort();

    let newer = tokio::spawn(std::future::pending::<anyhow::Result<()>>());
    let newer_id = newer.id();
    *downloads.lock().await = Some(newer.abort_handle());
    assert!(!finish_download(cancelled, &downloads).await.unwrap());
    assert_eq!(downloads.lock().await.as_ref().unwrap().id(), newer_id);

    downloads.lock().await.take().unwrap().abort();
    assert!(!finish_download(newer, &downloads).await.unwrap());
    assert!(downloads.lock().await.is_none());
}
