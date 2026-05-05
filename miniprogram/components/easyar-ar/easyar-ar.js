import CrsClient from '../libs/crs-client';
import { atob } from '../libs/atob';

Component({
    properties: {
        runingCrs: {
            type: Boolean,
            value: false,
        },
        config: Object,
        tracking: {
            type: Boolean,
            value: false,
        },
    },
    observers: {
        'runingCrs, tracking': function (value1, value2) {
            if (value1 && !this.data.arReady) {
                wx.showModal({
                    title: 'AR系统未启动',
                    content: '可能是你的相机未启动或不支持XR-FRAME',
                    showCancel: false,
                });
            }

            if (!value2) {
                this.stopTracking();
            }
        },
    },
    data: {
        loaded: false,
        arReady: false,
        markerImg: '',
        lastTime: 0,
        isSearching: false,
    },
    crsClient: undefined,
    lifetimes: {
        attached() {
            this.crsClient = new CrsClient(this.properties.config);

            const sys = wx.getSystemInfoSync();
            if (sys.platform == 'devtools') {
                wx.showModal({
                    title: '提示',
                    content: '开发工具上不支持AR，请使用手机预览。',
                    showCancel: false,
                });
            }
        },
        detached() {

        }
    },
    methods: {
        handleReady({ detail }) {
            this.scene = detail.value;
            this.shadowRoot = this.scene.getElementById('shadow-root');
            this.xrFrameSystem = wx.getXrFrameSystem();
        },
        handleARReady: function ({ detail }) {
            this.setData({ arReady: true });
        },
        handleTick() {
            if (!this.data.arReady || !this.properties.runingCrs || !this.crsClient || this.data.isSearching) {
                return;
            }

            const now = Date.now();
            if (now - this.data.lastTime < this.properties.config.minInterval) {
                return;
            }
            this.data.lastTime = now;
            this.data.isSearching = true;

            // 文档：https://developers.weixin.qq.com/miniprogram/dev/component/xr-frame/share/
            // 截图并发送到云识别服务            
            this.capture().then(base64 => this.crsClient.searchByBase64(base64.split('base64,').pop())).then(res => {
                this.data.isSearching = false;
                console.info(res)

                if (res.statusCode != 0) {
                    return;
                }

                // res.statusCode = 0 表示识别到目标
                // 识别成功后，处理你的业务逻辑
                // 可以展示图片，播放视频，渲染模型等
                const title = res.statusCode == 0 ? `识别到 ${res.result.target.name}` : `未识别到目标`;
                wx.showToast({ title, icon: 'none' });


                this.triggerEvent('searchSuccess', res, {});
                const target = res.result.target;

                // 设置marker
                this.loadTrackingImage(target.trackingImage.replace(/[\r\n]/g, ''));

                // 从meta信息中检测是模型，还是视频
                // meta内容请参考文档：https://help.easyar.cn/EasyAR%20Miniprogram/manual.html
                try {
                    const setting = JSON.parse(atob(target.meta));
                    if (setting.modelUrl) {
                        this.loadModel(target.targetId, setting);
                    } else if (setting.videoUrl) {
                        this.loadVideo(target.targetId, setting);
                    }
                } catch (e) {
                    console.error(e);
                    wx.showModal({
                        title: '提示',
                        content: 'meta信息解析错误',
                        showCancel: false,
                    })
                }
            }).catch(err => {
                this.data.isSearching = false;
                console.info(err)
            });
        },
        capture() {
            const opt = { type: 'jpg', quality: this.properties.config.jpegQuality };

            if (this.scene.share.captureToDataURLAsync) {
                return this.scene.share.captureToDataURLAsync(opt);
            }

            return Promise.resolve(this.scene.share.captureToDataURL(opt));
        },
        stopTracking() {
            this.setData({ markerImg: '' });

            if (this.scene) {
                const el = this.scene.getElementById('player');
                this.shadowRoot.removeChild(el);
            }
        },
        loadTrackingImage(img) {
            const filePath = `${wx.env.USER_DATA_PATH}/marker.jpg`;
            wx.getFileSystemManager().writeFile({
                filePath,
                data: img,
                encoding: 'base64',
                success: (r) => {
                    // 测试过程中发现问题：android与iOS在处理临时文件上有不同
                    if (wx.getSystemInfoSync().platform == 'ios') {
                        this.toTempFile(filePath);
                        return;
                    }

                    this.setData({ markerImg: filePath });
                },
                fail: (err) => reject(err),
            });
        },
        loadModel: function (targetId, setting) {
            wx.showToast({
                icon: 'none',
                title: '模型加载中...',
                duration: 2000,
            });

            const asset = this.scene.assets.getAssetWithState('gltf', targetId);
            if (asset.state == 0) {
                this.scene.assets.loadAsset({ type: 'gltf', assetId: targetId, src: setting.modelUrl });
            }

            const el = this.scene.createElement(this.xrFrameSystem.XRGLTF, { 'model': targetId, 'anim-autoplay': '' });
            el.setId("player");
            this.shadowRoot.addChild(el);

            const t = el.getComponent(this.xrFrameSystem.Transform);
            setting.scale = 0.4;
            t.scale.setValue(setting.scale, setting.scale, setting.scale);
            // 绕X轴旋转-90度，使模型从水平状态变为垂直于地面
            t.rotation.setValue(-90, 0, 0);

            wx.showToast({
                icon: 'none',
                title: '请将相机对着识别图',
            });

        },
        loadVideo: async function (targetId, setting) {
            wx.showToast({
                icon: 'none',
                title: '视频加载中...',
                duration: 2000,
            });

            let asset = this.scene.assets.getAsset('video-texture', targetId);
            if (!asset) {
                const v = await this.scene.assets.loadAsset({
                    type: 'video-texture', assetId: targetId, src: setting.videoUrl,
                    options: { autoPlay: true, abortAudio: false }
                });
                asset = v.value;
            }

            const { width, height } = asset;
            const el = this.scene.createElement(this.xrFrameSystem.XRMesh, { geometry: 'plane', uniforms: `u_baseColorMap:video-${targetId}` });
            el.setId("player");
            this.shadowRoot.addChild(el);

            const w = 1;
            const h = height / width;

            const t = el.getComponent(this.xrFrameSystem.Transform);
            t.scale.setValue(w, 1, h);

            wx.showToast({
                icon: 'none',
                title: '请将相机对着识别图',
            });
        },
        toTempFile(filePath) {
            wx.compressImage({
                src: filePath,
                quality: 90,
                success: (res) => {
                    console.info(res);
                    this.setData({ markerImg: res.tempFilePath });
                }, fail: (err) => {
                    console.info(err);
                }
            });
        },
    }
})