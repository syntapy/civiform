package services;

/* Enum to refer to lang strings listed in applications.conf */
public enum MessageLang {
  EN_US("en-US"),
  AM("am"),
  ZH_TW("zh-TW"),
  KO("ko"),
  SO("so"),
  ES_US("es-US"),
  TL("tl"),
  VI("vi");

  private final String lang;

  MessageLang(String lang) {
    this.lang = lang;
  }

  public String getLang() {
    return this.lang;
  }
}
