package views.dev;

import static com.google.common.base.Preconditions.checkNotNull;
import static j2html.TagCreator.a;
import static j2html.TagCreator.each;
import static j2html.TagCreator.form;
import static j2html.TagCreator.input;
import static j2html.TagCreator.table;
import static j2html.TagCreator.tbody;
import static j2html.TagCreator.td;
import static j2html.TagCreator.text;
import static j2html.TagCreator.tr;

import com.google.common.collect.ImmutableList;
import j2html.TagCreator;

import javax.inject.Inject;
import models.StoredFile;
import services.cloud.StorageClient;
import services.cloud.StorageUploadRequest;
import services.cloud.azure.BlobStorageUploadRequest;
import views.HtmlBundle;
import views.ViewUtils;
import views.WebJarJsPaths;

/** Strategy class for creating a file upload form for Azure. */
public class AzureStorageDevViewStrategy implements CloudStorageDevViewStrategy {

  private final StorageClient client;

  @Inject
  public AzureStorageDevViewStrategy(StorageClient client) {
    this.client = checkNotNull(client);
  }

  @Override
  public ContainerTag getFileUploadForm(
      ViewUtils viewUtils, StorageUploadRequest storageUploadRequest, HtmlBundle bundle)
      throws RuntimeException {
    if (!(storageUploadRequest instanceof BlobStorageUploadRequest)) {
      throw new RuntimeException(
          "Trying to upload file to dev Azurite (Azure emulator) blob storage using incorrect"
              + " upload request type.");
    }
    BlobStorageUploadRequest request = (BlobStorageUploadRequest) storageUploadRequest;
    bundle.addFooterScripts(
        viewUtils.makeWebJarsTag(/* assetsRoute= */ WebJarJsPaths.AZURE_STORAGE_BLOB));
    bundle.addFooterScripts(viewUtils.makeLocalJsTag(/* filename= */ "azure_upload"));

    ContainerTag formTag = form().withId("azure-upload-form-component");

    return formTag
        .with(input().attr("type", "file").attr("name", "file"))
        .with(input().attr("type", "hidden"))
        .attr("name", "key")
        .attr("value", request.fileName())
        .with(input().attr("type", "hidden").attr("name", "sasToken").attr("value", request.sasToken()))
        .with(input().attr("type", "hidden").attr("name", "blobUrl").attr("value", request.blobUrl()))
        .with(
            input().attr("type", "hidden").attr("name", "containerName").attr("value", request.containerName()))
        .with(input().attr("type", "hidden").attr("name", "fileName").attr("value", request.fileName()))
        .with(input().attr("type", "hidden").attr("name", "accountName").attr("value", request.accountName()))
        .with(
            input()
                .attr("type", "hidden")
                .attr("name", "successActionRedirect")
                .attr("value", request.successActionRedirect()))
        .with(
            TagCreator.button(text("Upload to Azure Blob Storage"))
                .attr("type", "submit")
                .withId("cf-block-submit"));
  }

  @Override
  public ContainerTag renderFiles(ImmutableList<StoredFile> files) {
    return table()
        .with(
            tbody(
                each(
                    files,
                    file ->
                        tr(
                            td(String.valueOf(file.id)),
                            td(
                                a(file.getOriginalFileName().isPresent()
                                        ? file.getOriginalFileName().get()
                                        : file.getName())
                                    .withHref(getPresignedUrl(file)))))));
  }

  @Override
  public String getPresignedUrl(StoredFile file) {
    return client.getPresignedUrlString(file.getName(), file.getOriginalFileName());
  }
}
