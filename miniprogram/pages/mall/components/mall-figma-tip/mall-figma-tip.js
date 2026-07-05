Component({
  data: {
    visible: false,
    message: "",
    iconSrc: "",
  },

  lifetimes: {
    detached() {
      if (this._timer) clearTimeout(this._timer);
    },
  },

  methods: {
    onCatchMove() {},

    show(opts) {
      if (!opts || !opts.message) return;
      const duration = typeof opts.duration === "number" ? opts.duration : 2000;
      if (this._timer) clearTimeout(this._timer);
      this.setData({
        visible: true,
        message: opts.message,
        iconSrc: opts.icon || "",
      });
      this._timer = setTimeout(() => {
        this.setData({ visible: false, iconSrc: "" });
        this._timer = null;
        if (typeof opts.onEnd === "function") {
          opts.onEnd();
        }
      }, duration);
    },
  },
});
