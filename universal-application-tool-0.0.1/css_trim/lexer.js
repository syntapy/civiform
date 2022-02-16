
// Variable as a key, e.g. Styles.BG_BLUE_200
this.rgx_key = /(?<= +public +static +final +String +)([0-9A-Z_]+)/g;

// Tailwind string value refered to by variable, e.g. 'bg-blue-200'
this.rgx_val = /(?<= +public +static +final +String +[0-9A-Z_]+ += +")([a-z0-9-/]+)/g;
class CoreStylesReader {
}
