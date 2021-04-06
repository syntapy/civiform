package modules;

import static com.google.common.base.Preconditions.checkNotNull;
import static play.mvc.Results.forbidden;
import static play.mvc.Results.redirect;

import auth.AdOidcClient;
import auth.AdfsProfileAdapter;
import auth.Authorizers;
import auth.FakeAdminClient;
import auth.GuestClient;
import auth.IdcsOidcClient;
import auth.IdcsProfileAdapter;
import auth.ProfileFactory;
import auth.Roles;
import auth.UatProfileData;
import com.google.common.collect.ImmutableMap;
import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.google.inject.Singleton;
import controllers.routes;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import javax.annotation.Nullable;
import javax.inject.Provider;
import org.pac4j.core.authorization.authorizer.RequireAllRolesAuthorizer;
import org.pac4j.core.client.Client;
import org.pac4j.core.client.Clients;
import org.pac4j.core.config.Config;
import org.pac4j.core.context.HttpConstants;
import org.pac4j.core.context.session.SessionStore;
import org.pac4j.core.http.callback.PathParameterCallbackUrlResolver;
import org.pac4j.oidc.client.OidcClient;
import org.pac4j.oidc.config.OidcConfiguration;
import org.pac4j.play.CallbackController;
import org.pac4j.play.LogoutController;
import org.pac4j.play.http.PlayHttpActionAdapter;
import org.pac4j.play.store.PlayCookieSessionStore;
import org.pac4j.play.store.ShiroAesDataEncrypter;
import play.Environment;
import play.libs.concurrent.HttpExecutionContext;
import repository.ApplicantRepository;
import repository.DatabaseExecutionContext;

public class SecurityModule extends AbstractModule {

  private final com.typesafe.config.Config configuration;
  private final String baseUrl;

  public SecurityModule(Environment environment, com.typesafe.config.Config configuration) {
    checkNotNull(environment);
    this.configuration = checkNotNull(configuration);
    this.baseUrl = configuration.getString("base_url");
  }

  @Override
  protected void configure() {
    // After logging in you are redirected to '/', and auth autorenews.
    CallbackController callbackController = new CallbackController();
    callbackController.setDefaultUrl(routes.HomeController.index().url());
    callbackController.setRenewSession(true);
    bind(CallbackController.class).toInstance(callbackController);

    // you can logout by hitting the logout endpoint, you'll be redirected to root page.
    LogoutController logoutController = new LogoutController();
    logoutController.setDefaultUrl(routes.HomeController.index().url());
    logoutController.setDestroySession(true);
    bind(LogoutController.class).toInstance(logoutController);

    // This is a weird one.  :)  The cookie session store refuses to serialize any
    // classes it doesn't explicitly trust.  A bug in pac4j interacts badly with
    // sbt's autoreload, so we have a little workaround here.  configure() gets called on every
    // startup,
    // but the JAVA_SERIALIZER object is only initialized on initial startup.
    // So, on a second startup, we'll add the UatProfileData a second time.  The
    // trusted classes set should dedupe UatProfileData against the old UatProfileData,
    // but it's technically a different class with the same name at that point,
    // which triggers the bug.  So, we just clear the classes, which will be empty
    // on first startup and will contain the profile on subsequent startups,
    // so that it's always safe to add the profile.
    // We will need to do this for every class we want to store in the cookie.
    PlayCookieSessionStore.JAVA_SERIALIZER.clearTrustedClasses();
    PlayCookieSessionStore.JAVA_SERIALIZER.addTrustedClass(UatProfileData.class);

    // We need to use the secret key to generate the encrypter / decrypter for the
    // session store, so that cookies from version n of the application can be
    // read by version n + 1.  This is especially important for dev, otherwise
    // we're going to spend a lot of time deleting cookies.
    Random r = new Random();
    r.setSeed(this.configuration.getString("play.http.secret.key").hashCode());
    byte[] aesKey = new byte[32];
    r.nextBytes(aesKey);
    PlayCookieSessionStore sessionStore =
        new PlayCookieSessionStore(new ShiroAesDataEncrypter(aesKey));
    bind(SessionStore.class).toInstance(sessionStore);
  }

  @Provides
  @Singleton
  protected GuestClient guestClient(ProfileFactory profileFactory) {
    return new GuestClient(profileFactory);
  }

  @Provides
  @Singleton
  protected ProfileFactory provideProfileFactory(
      DatabaseExecutionContext dbContext, HttpExecutionContext httpContext) {
    return new ProfileFactory(dbContext, httpContext);
  }

  @Provides
  @Singleton
  protected FakeAdminClient fakeAdminClient(ProfileFactory profileFactory) {
    return new FakeAdminClient(profileFactory);
  }

  @Provides
  @Nullable
  @Singleton
  @IdcsOidcClient
  protected OidcClient provideIDCSClient(
      ProfileFactory profileFactory, Provider<ApplicantRepository> applicantRepositoryProvider) {
    if (!this.configuration.hasPath("idcs.client_id")
        || !this.configuration.hasPath("idcs.secret")) {
      return null;
    }
    OidcConfiguration config = new OidcConfiguration();
    config.setClientId(this.configuration.getString("idcs.client_id"));
    config.setSecret(this.configuration.getString("idcs.secret"));
    config.setDiscoveryURI(this.configuration.getString("idcs.discovery_uri"));
    config.setResponseMode("form_post");
    config.setResponseType("id_token");
    config.setUseNonce(true);
    config.setWithState(false);
    OidcClient client = new OidcClient(config);
    client.setCallbackUrl(baseUrl + "/callback");
    client.setProfileCreator(
        new IdcsProfileAdapter(config, client, profileFactory, applicantRepositoryProvider));
    client.setCallbackUrlResolver(new PathParameterCallbackUrlResolver());
    return client;
  }

  @Provides
  @Nullable
  @Singleton
  @AdOidcClient
  protected OidcClient provideAdClient(
      ProfileFactory profileFactory, Provider<ApplicantRepository> applicantRepositoryProvider) {
    if (!this.configuration.hasPath("adfs.client_id")
        || !this.configuration.hasPath("adfs.secret")) {
      return null;
    }
    OidcConfiguration config = new OidcConfiguration();
    config.setClientId(this.configuration.getString("adfs.client_id"));
    config.setSecret(this.configuration.getString("adfs.secret"));
    config.setDiscoveryURI(this.configuration.getString("adfs.discovery_uri"));
    config.setResponseMode("form_post");
    config.setResponseType("id_token");
    config.setUseNonce(true);
    config.setWithState(false);
    OidcClient client = new OidcClient(config);
    client.setName("AdClient");
    client.setCallbackUrl(baseUrl + "/callback");
    client.setProfileCreator(
        new AdfsProfileAdapter(config, client, profileFactory, applicantRepositoryProvider));
    client.setCallbackUrlResolver(new PathParameterCallbackUrlResolver());
    return client;
  }

  @Provides
  @Singleton
  protected Config provideConfig(
      GuestClient guestClient,
      @AdOidcClient @Nullable OidcClient adClient,
      @IdcsOidcClient @Nullable OidcClient idcsClient,
      FakeAdminClient fakeAdminClient) {
    List<Client> clientList = new ArrayList<Client>();
    clientList.add(guestClient);
    if (idcsClient != null) {
      clientList.add(idcsClient);
    }
    if (adClient != null) {
      clientList.add(adClient);
    }
    if (URI.create(this.baseUrl).getHost().equals("localhost")) {
      clientList.add(fakeAdminClient);
    }
    Clients clients = new Clients(baseUrl + "/callback");
    clients.setClients(clientList);
    PlayHttpActionAdapter.INSTANCE
        .getResults()
        .putAll(
            ImmutableMap.of(
                HttpConstants.UNAUTHORIZED,
                redirect(routes.HomeController.loginForm(Optional.of("login"))),
                HttpConstants.FORBIDDEN,
                forbidden("403 forbidden").as(HttpConstants.HTML_CONTENT_TYPE)));
    Config config = new Config();
    config.setClients(clients);
    config.addAuthorizer(
        Authorizers.PROGRAM_ADMIN.toString(),
        new RequireAllRolesAuthorizer(Roles.ROLE_PROGRAM_ADMIN.toString()));
    config.addAuthorizer(
        Authorizers.UAT_ADMIN.toString(),
        new RequireAllRolesAuthorizer(Roles.ROLE_UAT_ADMIN.toString()));
    config.addAuthorizer(
        Authorizers.APPLICANT.toString(),
        new RequireAllRolesAuthorizer(Roles.ROLE_APPLICANT.toString()));
    config.addAuthorizer(
        Authorizers.TI.toString(), new RequireAllRolesAuthorizer(Roles.ROLE_TI.toString()));

    config.setHttpActionAdapter(PlayHttpActionAdapter.INSTANCE);
    return config;
  }
}
