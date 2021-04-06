package models;

import com.google.common.collect.ImmutableList;
import io.ebean.annotation.DbJson;
import io.ebean.annotation.History;
import io.ebean.annotation.WhenCreated;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import javax.persistence.Entity;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.persistence.Table;
import play.data.validation.Constraints;
import services.applicant.ApplicantData;

/** The ebean mapped class that represents an individual applicant */
@Entity
@Table(name = "applicants")
public class Applicant extends BaseModel {
  private static final long serialVersionUID = 1L;
  private ApplicantData applicantData;

  @WhenCreated public Instant whenCreated;

  private String preferredLocale;

  @Constraints.Required @DbJson private String object;
  @ManyToOne private Account account;

  @OneToMany(mappedBy = "applicant")
  private List<Application> applications;

  public Applicant() {
    super();
  }

  public ApplicantData getApplicantData() {
    // This is called both before and after serialization, so we need to handle
    // all three cases - loading from the database, where `object` contains the
    // data and `applicantData` is null, first initialization, where `object`
    // is null and the `applicantData` is also `null`, and in-memory use, where
    // `object` is out-of-date but non-null, and `applicantData` is already valid.
    if (this.applicantData == null && (object != null && !object.isEmpty())) {
      if (preferredLocale == null || preferredLocale.isEmpty()) {
        // Default to English until the applicant specifies their preferred language.
        this.applicantData = new ApplicantData(object);
      } else {
        this.applicantData = new ApplicantData(Locale.forLanguageTag(preferredLocale), object);
      }
    } else if (this.applicantData == null) {
      this.applicantData = new ApplicantData();
    }
    return applicantData;
  }

  @PrePersist
  @PreUpdate
  public void synchronizeObject() {
    this.preferredLocale = getApplicantData().preferredLocale().toLanguageTag();
    this.object = objectAsJsonString();
  }

  private String objectAsJsonString() {
    return getApplicantData().asJsonString();
  }

  public Account getAccount() {
    return account;
  }

  public void setAccount(Account account) {
    this.account = account;
  }

  public ImmutableList<Application> getApplications() {
    return ImmutableList.copyOf(this.applications);
  }

  public Instant getCreatedTime() {
    return this.whenCreated;
  }
}
