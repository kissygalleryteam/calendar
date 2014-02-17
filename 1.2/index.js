/**
 * @fileoverview 一个为旅行业务量身定制的日历组件
 * @author 昂天<fgm@fgm.cc>
 * @module calendar
 **/
KISSY.add(function(S, Node, Base, DateTool, Holidays) {

    var $ = Node.all;
    var TMP = S.substitute;
    var WIN = S.one(window);
    var DOC = S.one(document);

    /**
     * @name Calendar
     * @class 旅行日历
     * @since 1.2
     * @constructor
     * @extends Base
     */

    function Calendar() {
        var self = this;

        // 调用父类构造函数
        Calendar.superclass.constructor.apply(self, arguments);

        // 初始化组件
        self._initializer();
    }

    S.extend(Calendar, Base, {

        /**
         * 日历初始化
         *
         * @method _initializer
         * @private
         */
        _initializer: function() {
            var self = this;

            // 如果配置显示节假日，生成日期数据
            if (self.get('isHoliday')) {
                self._dateMap = Holidays.dates();
            }

            // 设置日历唯一标记
            self._setUniqueTag()

            // 渲染日历
            self.renderUI();

            // 如果结构渲染失败，直接退出
            if (!self.boundingBox) return;

            // 最小日期缓存
            self._minDateCache = self.get('minDate');

            // 日历外部点击函数
            self._clickoutside = function(e) {
                var target = $(e.target);

                if (
                // 包含触发节点样式标识
                target.hasClass(self._triggerNodeClassName) ||

                // 包含日历图标样式标识
                target.hasClass(self._triggerNodeIcon) ||

                // 事件对象在日历内部
                target.parent('#' + self._calendarId) ||

                // 隐藏日历标记为false
                !self._hide) {
                    // 满足以上条件，日历外部点击事件不成立
                    return;
                }

                // 日历外部点击事件成立，隐藏日历组件
                self.hide();
            };

            // 非静态日历时，初始化隐藏日历组件
            if (!self.get('container')) {

                // 标记隐藏日历
                self._hide = true;

                // 隐藏日历组件
                self.hide();
            }
        },

        /**
         * 渲染日历结构
         *
         * @method renderUI
         */
        renderUI: function() {
            var self = this;
            var container = S.one(self.get('container'));

            (container || $('body')).append(self._initCalendarHTML(self.get('date')));

            self.boundingBox = S.one('#' + self._calendarId);

            // 如果结构渲染失败，直接退出
            if (!self.boundingBox) return;

            self.boundingBox.css('position', container ? 'relative' : 'absolute');

            self._dateBox = self.boundingBox.one('.date-box');
            self._contentBox = self.boundingBox.one('.content-box');
            self._messageBox = self.boundingBox.one('.message-box');

            container || (self._inputWrap()._setDefaultValue(), self.boundingBox.css('top', '-9999px'));

            self.set('boundingBox', self.boundingBox);

            self.bindUI()._fixSelectMask()._setWidth()._setBtnStates()._setDateStyle();
        },

        /**
         * 事件绑定
         *
         * @method bindUI
         */
        bindUI: function() {
            var self = this;

            self.on('afterMessageChange', self._setMessage);

            self.boundingBox.delegate('click', '.' + self._delegateClickClassName, self._DELEGATE.click, self);
            self.boundingBox.delegate('change', '.' + self._delegateChangeClassName, self._DELEGATE.change, self);

            // 静态日历，不绑定以下事件
            if (self.get('container')) {
                return self;
            }

            self.boundingBox.delegate('mouseenter mouseleave', 'a', self._DELEGATE.mouse, self);

            DOC.delegate('focusin', '.' + self._triggerNodeClassName, self._DELEGATE.focusin, self);
            DOC.delegate('keyup', '.' + self._triggerNodeClassName, self._DELEGATE.keyup, self);
            DOC.delegate('keydown', '.' + self._triggerNodeClassName, self._DELEGATE.keydown, self);
            DOC.delegate('click', '.' + self._triggerNodeIcon, self._DELEGATE.iconClick, self);
            DOC.delegate('click', '.' + self._triggerNodeClassName, self._DELEGATE.triggerNodeClick, self);

            WIN.on('resize', self._setPos, self);

            return self;
        },

        /**
         * 删除事件绑定
         *
         * @method datechEvent
         */
        detachEvent: function() {
            var self = this;

            self.detach('afterMessageChange', self._setMessage);
            self.boundingBox.detach();
            DOC.undelegate('focusin', '.' + self._triggerNodeClassName, self._DELEGATE.focusin, self);
            DOC.undelegate('keyup', '.' + self._triggerNodeClassName, self._DELEGATE.keyup, self);
            DOC.undelegate('keydown', '.' + self._triggerNodeClassName, self._DELEGATE.keydown, self);
            DOC.undelegate('click', '.' + self._triggerNodeIcon, self._DELEGATE.iconClick, self);
            DOC.undelegate('click', '.' + self._triggerNodeClassName, self._DELEGATE.triggerNodeClick, self);
            WIN.detach('resize', self._setPos, self);
        },

        /**
         * 销毁日历组件
         *
         * @method destroy
         */
        destroy: function() {
            var self = this;

            // 删除所有绑定事件
            self.detachEvent();

            // 删除DOM
            self.boundingBox.remove();
        },

        /**
         * 同步UI，主要用于动态创建触发元素后使用
         *
         * @method syncUI
         */
        syncUI: function() {
            var self = this;

            if (!self.get('container') && (self.get('triggerNode') || self.get('finalTriggerNode'))) {
                self._inputWrap();
            }
        },

        /**
         * 渲染方法
         *
         * @method render
         */
        render: function() {
            var self = this;

            self._dateBox.html(self._dateHTML());
            self._setWidth()._setDateStyle()._setBtnStates();
            self.fire('render');

            return self;
        },

        /**
         * 渲染下月日历
         *
         * @method nextMonth
         */
        nextMonth: function() {
            var self = this;

            self.set('date', Calendar.DATE.siblingsMonth(self.get('date'), 1));
            self.render();
            self.fire('nextmonth');

            return self;
        },

        /**
         * 渲染上月日历
         *
         * @method prevMonth
         */
        prevMonth: function() {
            var self = this;

            self.set('date', Calendar.DATE.siblingsMonth(self.get('date'), -1));
            self.render();
            self.fire('prevmonth');

            return self;
        },

        /**
         * 显示日历
         *
         * @method show
         */
        show: function() {
            var self = this;

            self.boundingBox.show();
            self._setDefaultDate().render();
            self.fire('show', {
                'node': self.currentNode
            });

            S.later(function() {
                DOC.on('click', self._clickoutside, self);
            }, 100, false);

            return self;
        },

        /**
         * 隐藏日历
         *
         * @method hide
         */
        hide: function() {
            var self = this;

            DOC.detach('click', self._clickoutside, self);

            self.boundingBox.hide();
            self.hideMessage();

            if (self.currentNode) {
                self.currentNode.getDOMNode()._selected = null;
            }

            self._cacheNode = null;
            self._hide = true;

            self.fire('hide', {
                'node': self.currentNode
            });

            return self;
        },

        /**
         * 显示提示信息
         *
         * @method showMessage
         */
        showMessage: function() {
            var self = this;

            self.fire('showmessage');

            S.later(function() {
                self._messageBox.addClass('visible');
            }, 5, false);

            return self;
        },

        /**
         * 隐藏提示信息
         *
         * @method hideMessage
         */
        hideMessage: function() {
            var self = this;

            self._messageBox.removeClass('visible');
            self.fire('hidemessage');

            return self;
        },

        /**
         * 获取选择的日期
         *
         * @method getSelectedDate
         * @return {String} 日期字符串
         */
        getSelectedDate: function() {
            var self = this;

            return self.get('selectedDate');
        },

        /**
         * 获取当前触发元素节点
         *
         * @method getCurrentNode
         * @return {Node} 节点对象
         */
        getCurrentNode: function() {
            var self = this;

            return self.currentNode;
        },

        /**
         * 获取指定日期相关信息
         *
         * @method getDateInfo
         * @param  {String} v 日期字符串
         * @return {String} 日期信息
         */
        getDateInfo: function(v) {
            var self = this;

            var date = Calendar.DATE.stringify(Calendar.DATE.parse(v));
            var iDiff = -1;
            var sNowDate = Calendar.DATE.stringify(new Date);
            var sDateName = ['今天', '明天', '后天'];

            switch (true) {
                case date == sNowDate:
                    iDiff = 0;
                    break;
                case date == Calendar.DATE.siblings(sNowDate, 1):
                    iDiff = 1;
                    break;
                case date == Calendar.DATE.siblings(sNowDate, 2):
                    iDiff = 2;
                    break;
            }
            return this._dateMap && this._dateMap[date] || sDateName[iDiff] || Calendar.DATE.week(date);
        },

        /**
         * 设置指定触发节点的日期信息
         *
         * @method setDateInfo
         * @param  {String} v    日期字符串
         * @param  {Node}   node Node节点
         */
        setDateInfo: function(v, node) {
            var self = this;

            self._setDateInfo(v, S.one(node));
        },

        /**
         * 获取指定的日期状态
         *
         * @method _getDateStatus
         * @param  {String} v 日期字符串
         * @private
         * @return {Boolean}
         */
        _getDateStatus: function(v) {
            var self = this;

            return (self.get('minDate') && Calendar.DATE.parse(v) < Calendar.DATE.parse(self.get('minDate'))) || (self.get('maxDate') && Calendar.DATE.parse(v) > Calendar.DATE.parse(self.get('maxDate'))) || (S.inArray(v, self.get('disabled')));
        },

        /**
         * 获取指定日期className
         *
         * @method _getHolidaysClass
         * @param  {String}  v 日期字符串
         * @param  {Boolean} s 日期状态
         * @private
         * @return {String}    样式名
         */
        _getHolidaysClass: function(v, s) {
            var self = this;

            switch (true) {
                case s:
                case !self.get('isHoliday'):
                    return '';
                case v == Calendar.DATE.stringify(new Date):
                    return 'today';
                case true:
                    return Holidays.getClassName(v);
            }
        },

        /**
         * 设置日历容器宽度
         *
         * @method _setWidth
         * @private
         */
        _setWidth: function() {
            var self = this;

            var boundingBox = self.boundingBox;
            var contentBox = self._contentBox;

            boundingBox.all('.inner, h4').css('width', boundingBox.one('table').outerWidth());
            boundingBox.css('width', boundingBox.one('.inner').outerWidth() * self.get('count') + parseInt(contentBox.css('borderLeftWidth')) + parseInt(contentBox.css('borderRightWidth')) + parseInt(contentBox.css('paddingLeft')) + parseInt(contentBox.css('paddingRight')));

            // IE6兼容处理
            if (S.UA.ie == 6) {
                boundingBox.one('iframe').css({
                    width: boundingBox.outerWidth(),
                    height: boundingBox.outerHeight()
                });
            }

            return self;
        },

        /**
         * 触发元素赋值
         *
         * @method _setValue
         * @param  {String}  v   日期字符串
         * @param  {Boolean} set 是否给输入框赋值
         * @private
         */
        _setValue: function(v, set) {
            var self = this;

            // 设置日历已选择日期
            this.set('selectedDate', v);

            // 静态日历设置不做设置
            if (this.get('container')) {
                return self;
            }

            // 如果触发元素是输入框，设置值
            if (self._isInput(self.currentNode) && !set) {
                self.currentNode.val(v);
            }

            switch (true) {
                case self.boundingBox.hasClass('calendar-bounding-box-style'):
                    self.set('endDate', v);
                    break;
                case !self.boundingBox.hasClass('calendar-bounding-box-style') && !!self.get('finalTriggerNode'):
                    var node = S.one(self.get('finalTriggerNode'));
                    self.set('startDate', v);
                    if (node && self.get('isAutoSwitch')) {
                        node.getDOMNode().select();
                    }
                    break;
                default:
                    self.set('selectedDate', v);
                    break;
            }

            return self;
        },

        /**
         * 设置日期信息
         *
         * @method _setDateInfo
         * @param  {String} v    日期字符串
         * @param  {Node}   node 当前触发节点
         * @private
         */
        _setDateInfo: function(v, node) {
            var self = this;

            var node = node || self.currentNode;

            if (!self.get('container') && self.get('isDateInfo') && self._isInput(node)) {
                node.prev().html(Calendar.DATE.isDate(v) ? self.getDateInfo(v) : '');
            }

            return self;
        },

        /**
         * 设置触发元素默认值对应的日期信息
         *
         * @method _setDefaultValue
         * @private
         */
        _setDefaultValue: function() {
            var self = this;

            var triggerNode = S.one(self.get('triggerNode'));
            var finalTriggerNode = S.one(self.get('finalTriggerNode'));
            var startDate = triggerNode && triggerNode.val();
            var endDate = finalTriggerNode && finalTriggerNode.val();

            if (self.get('isDateInfo')) {
                if (Calendar.DATE.isDate(startDate)) {
                    self.set('startDate', startDate);
                    self._setDateInfo(startDate, triggerNode);
                }
                if (Calendar.DATE.isDate(endDate)) {
                    self.set('endDate', endDate);
                    self._setDateInfo(endDate, finalTriggerNode);
                }
            }

            return self;
        },

        /**
         * 设置触发元素默认值对应的日历日期
         *
         * @method _setDefaultDate
         * @private
         */
        _setDefaultDate: function() {
            var self = this;

            // 静态日历直接退出
            if (self.get('container')) {
                return self;
            }

            var date = self.get('date');
            var startDate = self.get('startDate');
            var endDate = self.get('endDate');
            var isEndCalendar = self.boundingBox.hasClass('calendar-bounding-box-style');

            // 如果包含开始时间，设置日历的最小日期
            if (self.get('startDate')) {
                self.set('minDate', isEndCalendar ? startDate : self._minDateCache);
            }

            // 如果为结束日历并且开始日期大于结束日期，将日历日期设为开始日期（开始不存在，取原始开始日期）
            if (isEndCalendar && Calendar.DATE.parse(startDate) > Calendar.DATE.parse(endDate)) {
                self.set('date', startDate || date);
                return self;
            }

            // 设置日历日期为触发元素节点值（如果值为空，取原始开始日期）
            self.set('date', self.currentNode.val() || date);

            return self;
        },

        /**
         * 设置时间样式
         *
         * @method _setDateStyle
         * @private
         */
        _setDateStyle: function() {
            var self = this;

            var startDate = self.get('startDate');
            var endDate = self.get('endDate');

            self.boundingBox.all('td').each(function(node) {
                var date  = node.attr('data-date');

                if (node.hasClass('disabled')) {
                    return self;
                }

                // 移除已有标记
                node.removeClass('start-date').removeClass('end-date').removeClass('selected-range').removeClass('selected-date');

                // 标识开始日期
                if (date == startDate) {
                    node.addClass('start-date');
                }

                // 标记结束日期
                if (date == endDate) {
                    node.addClass('end-date');
                }

                // 标记选择的日期
                if (date == self.get('selectedDate')) {
                    node.addClass('selected-date');
                }

                var dDate = Calendar.DATE.parse(date);
                var dStartDate = Calendar.DATE.parse(startDate);
                var dEndDate = Calendar.DATE.parse(endDate);

                // 如果无开始时间或者无结束时间或者开始时间小于结束时间，不标记开始与结束之间的日期
                if (!startDate || !endDate || dStartDate > dEndDate) {
                    return self;
                }

                // 标记开始与结束之间的日期
                if (dDate > dStartDate && dDate < dEndDate) {
                    node.addClass('selected-range');
                }
            });

            return self;
        },

        /**
         * 设置上月/下月/关闭按钮状态
         *
         * @method _setBtnStates
         * @private
         */
        _setBtnStates: function() {
            var self = this;

            var curDate = +Calendar.DATE.siblingsMonth(self.get('date'), 0);
            var maxDate = self.get('maxDate');
            var minDate = self.get('minDate');
            var prevBtn = self.boundingBox.one('.prev-btn');
            var nextBtn = self.boundingBox.one('.next-btn');
            var closeBtn = self.boundingBox.one('.close-btn');

            if (minDate) {
                minDate = +Calendar.DATE.parse(minDate);
            }
            if (maxDate) {
                maxDate = +Calendar.DATE.siblingsMonth(Calendar.DATE.parse(maxDate), 1 - self.get('count'));
            }

            prevBtn[curDate <= (minDate || Number.MIN_VALUE) ? 'addClass' : 'removeClass']('prev-btn-disabled');
            nextBtn[curDate >= (maxDate || Number.MAX_VALUE) ? 'addClass' : 'removeClass']('next-btn-disabled');

            // 静态日历隐藏关闭按钮
            if (self.get('container')) {
                closeBtn.hide();
            }

            return self;
        },

        /**
         * 设置日历提示信息
         *
         * @method _setMessage
         * @private
         */
        _setMessage: function() {
            var self = this;

            self._messageBox.html(self.get('message'));

            return self;
        },

        /**
         * 设置唯一标记
         *
         * @method _setUniqueTag
         * @private
         */
        _setUniqueTag: function() {
            var self = this;

            var guid = S.guid();
            self._calendarId = 'calendar-' + guid;
            self._delegateClickClassName = 'delegate-click-' + guid;
            self._delegateChangeClassName = 'delegate-change-' + guid;
            self._triggerNodeIcon = 'trigger-icon-' + guid;
            self._triggerNodeClassName = 'trigger-node-' + guid;

            return self;
        },

        /**
         * 设置日历显示位置
         *
         * @method _setPos
         * @private
         */
        _setPos: function() {
            var self = this;

            var currentNode = self.currentNode;
            var boundingBox = self.boundingBox;

            // 如果无当前触发节点，直接退出
            if (!currentNode) {
                return self;
            }

            S.later(function() {
                var iLeft = currentNode.offset().left;
                var iTop = currentNode.offset().top + currentNode.outerHeight();
                var iBoundingBoxWidth = boundingBox.outerWidth();
                var iBoundingBoxHeight = boundingBox.outerHeight();
                var iCurrentNodeWidth = currentNode.outerWidth();
                var iCurrentNodeHeight = currentNode.outerHeight();
                var iMaxLeft = S.DOM.viewportWidth() - iBoundingBoxWidth;
                var iMaxTop = S.DOM.viewportHeight() - iBoundingBoxHeight;

                (function(t, l) {
                    if (iTop > iMaxTop) iTop = t < 0 ? iTop : t;
                    if (iLeft > iMaxLeft) iLeft = l < 0 ? iLeft : l;
                })(iTop - iBoundingBoxHeight - iCurrentNodeHeight, iLeft + iCurrentNodeWidth - iBoundingBoxWidth);

                boundingBox.css({
                    top: iTop,
                    left: iLeft
                });
            }, 10, false);

            return self;
        },

        /**
         * 创建触发元素外容器
         *
         * @method _inputWrap
         * @private
         */
        _inputWrap: function() {
            var self = this;

            var triggerNodeList = $(self.get('triggerNode'));
            var finalTriggerNodeList = $(self.get('finalTriggerNode'));

            var isShowInfo = self.get('isDateInfo') || self.get('isDateIcon');

            // 创建开始触发元素外容器
            triggerNodeList.each(function(triggerNode) {
                if (isShowInfo && self._isInput(triggerNode) && !triggerNode.parent('.calendar-input-wrap')) {
                    var wrap = $(Calendar.INPUT_WRAP_TEMPLATE);
                    triggerNode.after(wrap);
                    wrap.append(TMP(Calendar.START_DATE_TEMPLATE, {
                        'delegate_icon': self._triggerNodeIcon
                    })).append(triggerNode);

                    // 如果设置了不显示日历图标，则将其删除
                    if (!self.get('isDateIcon')) {
                        triggerNode.prev().removeClass('calendar-start-icon');
                    }
                }

                triggerNode.addClass(self._triggerNodeClassName);

                // 如果触发元素为输入框，添加autocomplete属性
                if (self._isInput(triggerNode)) {
                    triggerNode.attr('autocomplete', 'off');
                }
            });

            // 创建结束触发元素外容器
            finalTriggerNodeList.each(function(finalTriggerNode) {
                if (isShowInfo && self._isInput(finalTriggerNode) && !finalTriggerNode.parent('.calendar-input-wrap')) {
                    var wrap = $(Calendar.INPUT_WRAP_TEMPLATE);
                    finalTriggerNode.after(wrap);
                    wrap.append(TMP(Calendar.END_DATE_TEMPLATE, {
                        'delegate_icon': self._triggerNodeIcon
                    })).append(finalTriggerNode);

                    // 如果设置了不显示日历图标，则将其删除
                    if (!self.get('isDateIcon')) {
                        finalTriggerNode.prev().removeClass('calendar-end-icon');
                    }
                }

                finalTriggerNode.addClass(self._triggerNodeClassName);

                // 如果触发元素为输入框，添加autocomplete属性
                if (self._isInput(finalTriggerNode)) {
                    finalTriggerNode.attr('autocomplete', 'off');
                }
            });

            return self;
        },

        /**
         * 修复ie6下日历无法遮挡select的bug
         *
         * @method _fixSelectMask
         * @private
         */
        _fixSelectMask: function() {
            var self = this;

            if (S.UA.ie == 6) {
                self.boundingBox.append('<iframe />');
            }

            return self;
        },

        /**
         * 鼠标移入事件
         *
         * @method _mouseenter
         * @param {Event} oTarget 事件对象
         * @private
         */
        _mouseenter: function(oTarget) {
            var self = this;

            var boundingBox = self.boundingBox;
            var startDate = self.get('startDate');
            var curDate = oTarget.attr('data-date');
            var tds = boundingBox.all('td');

            clearTimeout(self.leaveTimer);

            tds.removeClass('hover');

            // 如果开始日期大于结束日期，直接退出
            if (Calendar.DATE.parse(startDate) > Calendar.DATE.parse(curDate)) {
                return self;
            }

            tds.each(function(td) {
                var date = Calendar.DATE.parse(td.attr('data-date'));
                if (!td.hasClass('disabled') && date > Calendar.DATE.parse(startDate) && date < Calendar.DATE.parse(curDate)) {
                    td.addClass('hover');
                }
            });
        },

        /**
         * 鼠标移出事件
         *
         * @method _mouseleave
         * @private
         */
        _mouseleave: function() {
            var self = this;

            clearTimeout(self.leaveTimer);

            self.leaveTimer = setTimeout(function() {
                self.boundingBox.all('td').removeClass('hover');
            }, 30);
        },

        /**
         * 事件代理
         *
         * @type {Object}
         */
        _DELEGATE: {
            // 日历点击事件处理函数
            'click': function(e) {
                var self = this;

                e.preventDefault();

                var target = S.one(e.currentTarget);
                var date = target.attr('data-date');

                switch (true) {
                    case target.hasClass('prev-btn') && !target.hasClass('prev-btn-disabled'):
                        self.prevMonth();
                        break;
                    case target.hasClass('next-btn') && !target.hasClass('next-btn-disabled'):
                        self.nextMonth();
                        break;
                    case target.hasClass('close-btn'):
                        self.hide();
                        break;
                    case target && target.hasClass(self._delegateClickClassName) && self.boundingBox.hasClass('calendar-bounding-box-style') && date == self.get('minDate') && !self.get('isSameDate'):
                        break;
                    case !!date && !target.hasClass('disabled'):

                        // 关闭非静态日历
                        if (!self.get('container')) {
                            self.hide();
                        }
                        self._setValue(date)._setDateInfo(date)._setDateStyle().fire('dateclick', {
                            date: date,
                            dateInfo: self.getDateInfo(date)
                        });
                        break;
                }
            },

            // select元素日期选择事件处理函数
            'change': function(e) {
                var self = this;

                var selectList = self.boundingBox.all('.' + self._delegateChangeClassName);

                var year = selectList.item(0).val();
                var month = selectList.item(1).val();

                var maxDate = self.get('maxDate');

                if (maxDate && maxDate.substr(0, 4) == year) {
                    month = Calendar.DATE.filled(Math.min(month, maxDate.substr(5, 2)))
                }

                self.set('date', year + '-' + month + '-01');
                self.render();

                self.fire('selectchange', {
                    year: year,
                    month: month
                });

                // fix火狐浏览器对select操作时，触发clickoutside的bug
                self._hide = false;
                S.later(function() {
                    self._hide = true;
                }, 0);
            },

            // 鼠标移入/移出事件处理函数
            'mouse': function(e) {
                var self = this;

                var target = S.one(e.currentTarget).parent('td');

                if (target.hasClass('disabled')) {
                    return;
                }

                switch (e.type) {
                    case 'mouseenter':

                        // 如果为结束日历，关且有开始日期，执行鼠标移入事件函数
                        if (self.boundingBox.hasClass('calendar-bounding-box-style') && !!self.get('startDate')) {
                            self._mouseenter(target);
                        }
                        break;
                    case 'mouseleave':
                        self._mouseleave();
                        break;
                }
            },

            // 触发元素获取焦点处理函数
            'focusin': function(e) {
                var self = this;

                var target = self.currentNode = S.one(e.currentTarget);

                // 标记入住日历/离店日历。离店日历有className[check-out]
                self.boundingBox[self._inNodeList(target, $(self.get('triggerNode'))) ? 'removeClass' : 'addClass']('calendar-bounding-box-style');

                // 隐藏信息提示
                self.hideMessage();

                // 当缓存触发节点与当前触发节点不匹配时，调用一次hide方法
                if (self._cacheNode && self._cacheNode.getDOMNode() != target.getDOMNode()) {
                    self.hide();
                }

                // 当日历隐藏时，调用show方法
                if (self.boundingBox.css('display') == 'none') {
                    self.show()._setWidth()._setPos();
                }

                // 重新设置缓存触发节点
                self._cacheNode = target;
            },

            // 输入框输入事件处理函数
            'keyup': function(e) {
                var self = this;

                if (!self.get('isKeyup')) {
                    return;
                }

                clearTimeout(this.keyupTimer);

                var target = S.one(e.currentTarget);

                if (!self._isInput(target)) {
                    return;
                }

                var date = target.val();

                if (Calendar.DATE.isDate(date)) {
                    self._setDateInfo(date);
                    self.keyupTimer = setTimeout(function() {
                        var d = Calendar.DATE.parse(date);

                        self.set('date', d);
                        self._setValue(Calendar.DATE.stringify(d), true);
                        self.render();
                    }, 200);
                }
            },

            // 输入框Tab事件处理函数
            'keydown': function(e) {
                var self = this;

                if (e.keyCode == 9) {
                    self.hide();
                }
            },

            // icon点击事件处理函数
            'iconClick': function(e) {
                var self = this;

                var target = S.one(e.target).parent('.calendar-input-wrap').one('.' + self._triggerNodeClassName);
                var _target = target ? target.getDOMNode() : null;
                var currentNode = self.currentNode ? self.currentNode.getDOMNode() : null;

                if (_target != currentNode || self.boundingBox.css('display') == 'none') {
                    _target.focus();
                }
            },

            // 触发元素点击事件处理函数
            'triggerNodeClick': function(e) {
                var self = this;

                var target = e.target;

                if (!target._selected && self._isInput(S.one(target))) {
                    target.select();
                    target._selected = true;
                }
            }
        },

        /**
         * 获取同排显示的日历中最大的单元格数
         *
         * @method _maxCell
         * @private
         * @return {Number} 返回最大数
         */
        _maxCell: function() {
            var self = this;

            var oDate = self.get('date');
            var iYear = oDate.getFullYear();
            var iMonth = oDate.getMonth() + 1;
            var aCell = [];

            for (var i = 0; i < self.get('count'); i++) {
                aCell.push(new Date(iYear, iMonth - 1 + i, 1).getDay() + new Date(iYear, iMonth + i, 0).getDate());
            }

            return Math.max.apply(null, aCell);
        },

        /**
         * 判断node是不是input
         *
         * @method _isInput
         * @param  {Object} v node
         * @private
         */
        _isInput: function(v) {
            return v.getDOMNode && v.getDOMNode().tagName.toUpperCase() === 'INPUT' && (v.attr('type') === 'text' || v.attr('type') === 'date');
        },

        /**
         * 判断node是否在NodeList中
         *
         * @method _inNodeList
         * @param  {Node} node     node对象
         * @param  {Node} nodeList NodeList
         * @private
         * @return {Boolean}
         */
        _inNodeList: function(node, nodeList) {
            var bIn = false
            S.each(nodeList, function(o) {
                if (node.equals(o)) {
                    bIn = true;
                }
            });
            return bIn;
        },

        /**
         * 创建年/月选择器
         *
         * @method _createSelect
         * @private
         * @return {String}
         */
        _createSelect: function() {
            var self = this;

            var curDate = self.get('date');
            var minDate = self.get('minDate');
            var maxDate = self.get('maxDate');
            var curYear = curDate.getFullYear();
            var curMonth = Calendar.DATE.filled(curDate.getMonth() + 1);
            var minYear = minDate && minDate.substr(0, 4) || 1900;
            var maxYear = maxDate && maxDate.substr(0, 4) || new Date().getFullYear() + 3;
            var minMonth = minDate && minDate.substr(5, 2) || 1;
            var maxMonth = maxDate && maxDate.substr(5, 2) || 12;
            var selected = ' selected="selected"';
            var select_template = {};

            select_template['delegate_change'] = self._delegateChangeClassName;
            select_template['year_template'] = '';
            select_template['month_template'] = '';

            switch (true) {
                case curYear == minYear:
                    maxMonth = 12;
                    break;
                case curYear == maxYear:
                    minMonth = 1;
                    break;
                default:
                    minMonth = 1;
                    maxMonth = 12;
            }

            for (var i = minYear; i <= maxYear; i++) {
                select_template['year_template'] += '<option' + (curYear == i ? selected : '') + ' value="' + i + '">' + i + '</option>';
            }
            for (var i = minMonth; i <= maxMonth; i++) {
                select_template['month_template'] += '<option' + (curMonth == i ? selected : '') + ' value="' + Calendar.DATE.filled(i) + '">' + Calendar.DATE.filled(i) + '</option>';
            }
            return TMP(Calendar.SELECT_TEMPLATE, select_template);
        },

        /**
         * 生成日历模板
         *
         * @method _initCalendarHTML
         * @param {String} date 日期字符串yyyy-mm-dd
         * @private
         * @return {String} 返回日历字符串
         */
        _initCalendarHTML: function() {
            var self = this;

            var calendar_template = {};
            calendar_template['delegate_click'] = self._delegateClickClassName;
            calendar_template['bounding_box_id'] = self._calendarId;
            calendar_template['message_template'] = self.get('message');
            calendar_template['date_template'] = self._dateHTML();

            return TMP(Calendar.CALENDAR_TEMPLATE, calendar_template);
        },

        /**
         * 生成多日历模板
         *
         * @method _dateHTML
         * @param {Date} date 日期对象
         * @private
         * @return {String} 返回双日历模板字符串
         */
        _dateHTML: function(date) {
            var self = this;

            var date = self.get('date');
            var iYear = date.getFullYear();
            var iMonth = date.getMonth();
            var date_template = '';

            for (var i = 0; i < self.get('count'); i++) {
                date_template += TMP(Calendar.DATE_TEMPLATE, self._singleDateHTML(new Date(iYear, iMonth + i)));
            }
            return date_template;
        },

        /**
         * 生成单日历模板
         *
         * @method _singleDateHTML
         * @param {Date} date 日期对象
         * @private
         * @return {Object} 返回单个日历模板对象
         */
        _singleDateHTML: function(date) {
            var self = this;

            var iYear = date.getFullYear();
            var iMonth = date.getMonth() + 1;
            var firstDays = new Date(iYear, iMonth - 1, 1).getDay();
            var monthDays = new Date(iYear, iMonth, 0).getDate();
            var weeks = [
                {
                    name: '日',
                    cls: 'weekend'
                },
                {
                    name: '一',
                    cls: ''
                },
                {
                    name: '二',
                    cls: ''
                },
                {
                    name: '三',
                    cls: ''
                },
                {
                    name: '四',
                    cls: ''
                },
                {
                    name: '五',
                    cls: ''
                },
                {
                    name: '六',
                    cls: 'weekend'
                }
            ];

            //week template string
            var week_template = '';
            S.each(weeks, function(week) {
                week_template += TMP(Calendar.HEAD_TEMPLATE, {
                    week_name: week['name'],
                    week_cls: week['cls']
                });
            });

            //tbody template string
            var body_template = '';
            var days_array = [];
            for (; firstDays--;) {
                days_array.push(0);
            }
            for (var i = 1; i <= monthDays; i++) {
                days_array.push(i);
            }
            days_array.length = self._maxCell();
            var rows = Math.ceil(days_array.length / 7);
            var oData = self.get('data');
            for (var i = 0; i < rows; i++) {
                var calday_row = '';
                for (var j = 0; j <= 6; j++) {
                    var days = days_array[j + 7 * i] || '';
                    var date = days ? iYear + '-' + Calendar.DATE.filled(iMonth) + '-' + Calendar.DATE.filled(days) : '';
                    calday_row += TMP(Calendar.DAY_TEMPLATE, {
                        'day': days,
                        'date': date,
                        'disabled': self._getDateStatus(date) || !days ? 'disabled' : self._delegateClickClassName,
                        'date_class': self._getHolidaysClass(date, self._getDateStatus(date) || !days)
                    })
                }
                body_template += TMP(Calendar.BODY_TEMPLATE, {
                    calday_row: calday_row
                })
            }

            //table template object
            var table_template = {};

            //thead string
            table_template['head_template'] = week_template;

            //tbody string
            table_template['body_template'] = body_template;

            //single Calendar object
            var single_calendar_template = {};
            single_calendar_template['date'] = self.get('isSelect') ? self._createSelect() : iYear + '年' + iMonth + '月';
            single_calendar_template['table_template'] = TMP(Calendar.TABLE_TEMPLATE, table_template);

            //return single Calendar template object
            return single_calendar_template;
        }


    }, {

        DATE: DateTool,

        CALENDAR_TEMPLATE: ''
        + '<div id="{bounding_box_id}" class="calendar-bounding-box">'
            + '<div class="calendar-container">'
                + '<div class="message-box">{message_template}</div>'
                + '<div class="content-box">'
                    + '<div class="arrow">'
                        + '<span class="close-btn {delegate_click}" title="关闭">close</span>'
                        + '<span class="prev-btn {delegate_click}" title="上月">prev</span>'
                        + '<span class="next-btn {delegate_click}" title="下月">next</span>'
                    + '</div>'
                    + '<div class="date-box">{date_template}</div>'
                + '</div>'
            + '</div>'
        + '</div>',

        DATE_TEMPLATE: ''
        + '<div class="inner">'
            + '<h4>{date}</h4>'
            + '{table_template}'
        + '</div>',

        SELECT_TEMPLATE: ''
        + '<select class="{delegate_change}">{year_template}</select>年'
        + '<select class="{delegate_change}">{month_template}</select>月',

        TABLE_TEMPLATE: ''
        + '<table>'
            + '<thead>'
                + '<tr>{head_template}</tr>'
            + '</thead>'
            + '<tbody>'
                + '{body_template}'
            + '</tbody>'
        + '</table>',

        HEAD_TEMPLATE: ''
        + '<th class="{week_cls}">{week_name}</th>',

        BODY_TEMPLATE: ''
        + '<tr>{calday_row}</tr>',

        DAY_TEMPLATE: ''
        + '<td data-date="{date}" class="{disabled}">'
            + '<a href="javascript:;" class="{date_class}">{day}</a>'
        + '</td>',

        INPUT_WRAP_TEMPLATE: ''
        + '<div class="calendar-input-wrap" />',

        START_DATE_TEMPLATE: ''
        + '<span class="calendar-icon calendar-start-icon {delegate_icon}" />',

        END_DATE_TEMPLATE: ''
        + '<span class="calendar-icon calendar-end-icon {delegate_icon}" />',

        ATTRS: {

            /**
             * 日历外容器
             *
             * @attribute boundingBox
             * @type {Node}
             */
            boundingBox: {
                readOnly: true
            },

            /**
             * 日历初始日期
             *
             * @attribute date
             * @type {Date|String}
             * @default new Date()
             */
            date: {
                value: new Date(),
                setter: function(v) {
                    if (!S.isDate(v)) {
                        v = Calendar.DATE.isDate(v) ? v : new Date();
                    }
                    return v;
                },
                getter: function(v) {
                    if (S.isDate(v)) {
                        return v;
                    }
                    if (S.isString(v)) {
                        v = v.match(/\d+/g);
                        return new Date(v[0], v[1] - 1);
                    }
                }
            },

            /**
             * 日历个数
             *
             * @attribute count
             * @type {Number}
             * @default 2
             */
            count: {
                value: 2,
                getter: function(v) {
                    if (this.get('isSelect')) {
                        v = 1;
                    }
                    return v;
                }
            },

            /**
             * 选择的日期
             *
             * @attribute selectedDate
             * @type {String}
             * @default null
             */
            selectedDate: {
                value: null,
                setter: function(v) {
                    if (S.isDate(v)) {
                        v = Calendar.DATE.stringify(v);
                    }
                    return Calendar.DATE.isDate(v) ? v : null;
                },
                getter: function(v) {
                    if (S.isString(v)) {
                        v = Calendar.DATE.stringify(Calendar.DATE.parse(v));
                    }
                    return v || '';
                }
            },

            /**
             * 允许操作的最小日期
             *
             * @attribute minDate
             * @type {Date|String}
             * @default null
             */
            minDate: {
                value: null,
                setter: function(v) {
                    if (S.isDate(v)) {
                        v = Calendar.DATE.stringify(v);
                    }
                    return Calendar.DATE.isDate(v) ? v : null;
                },
                getter: function(v) {
                    if (S.isString(v)) {
                        v = Calendar.DATE.stringify(Calendar.DATE.parse(v));
                    }
                    return v || '';
                }
            },

            /**
             * 允许操作的最大日期
             *
             * @attribute maxDate
             * @type {Date|String}
             * @default null
             */
            maxDate: {
                value: null,
                setter: function(v) {
                    if (S.isDate(v)) {
                        v = Calendar.DATE.stringify(v);
                    }
                    return Calendar.DATE.isDate(v) ? v : null;
                },
                getter: function(v) {
                    if (S.isString(v)) {
                        v = Calendar.DATE.stringify(Calendar.DATE.parse(v));
                    }
                    return v || '';
                }
            },

            /**
             * 开始时间
             *
             * @attribute startDate
             * @type {String}
             * @default ''
             */
            startDate: {
                value: ''
            },

            /**
             * 结束时间
             *
             * @attribute endDate
             * @type {String}
             * @default ''
             */
            endDate: {
                value: ''
            },

            /**
             * 等价于设置minDate和maxDate，minDate未设置时取当前日期
             *
             * @attribute afterDays
             * @type {Number}
             * @default 0
             */
            afterDays: {
                value: 0,
                setter: function(v) {
                    if (v > 0) {
                        this.set('maxDate', Calendar.DATE.siblings(this.get('minDate') || Calendar.DATE.stringify(new Date), v));
                    }
                    return v;
                },
                getter: function(v) {
                    if (v && !this.get('minDate')) {
                        this.set('minDate', new Date());
                    }
                    return v;
                }
            },

            /**
             * 提示信息
             *
             * @attribute message
             * @type {String}
             * @default ''
             */
            message: {
                value: ''
            },

            /**
             * 触发节点，支持批量设置，用半角逗号分隔。弹出式日历必选配置。例('#ID, .className, ...')
             *
             * @attribute triggerNode
             * @type {String}
             * @default ''
             */
            triggerNode: {
                value: '',
                getter: function(v) {
                    if (/\,/.test(v)) {
                        v = v.replace(/\s+/g, '');
                        v = v.split(new RegExp('\\s+' + v + '+\\s', 'g'));
                        v = v.join().replace(/^,+|,+$/g, '');
                    }
                    return v
                }
            },

            /**
             * 最后触发节点，用于选择起始时间和结束时间互动，支持批量设置，用半角逗号分隔。例('#ID, .className, ...')
             *
             * @attribute finalTriggerNode
             * @type {String}
             * @default ''
             */
            finalTriggerNode: {
                value: '',
                getter: function(v) {
                    if (/\,/.test(v)) {
                        v = v.replace(/\s+/g, '');
                        v = v.split(new RegExp('\\s+' + v + '+\\s', 'g'));
                        v = v.join().replace(/^,+|,+$/g, '');
                    }
                    return v
                }
            },

            /**
             * 放置日历的容器。非弹出式日历必选配置
             *
             * @attribute container
             * @type {String}
             * @default null
             */
            container: {
                value: null,
                getter: function(v) {
                    if (/\,/.test(v)) {
                        v = v.replace(/\s+/g, '');
                        v = v.split(new RegExp('\\s+' + v + '+\\s', 'g'));
                        v = v.join().replace(/^,+|,+$/g, '');
                    }
                    return v
                }
            },

            /**
             * 是否开启下拉列表选择日期
             *
             * @attribute isSelect
             * @type {Boolean}
             * @default false
             */
            isSelect: {
                value: false
            },

            /**
             * 是否开启键盘输入关联
             *
             * @attribute isKeyup
             * @type {Boolean}
             * @default true
             */
            isKeyup: {
                value: true
            },

            /**
             * 是否显示日期信息
             *
             * @attribute isDateInfo
             * @type {Boolean}
             * @default true
             */
            isDateInfo: {
                value: true
            },

            /**
             * 是否显示日期图标
             *
             * @attribute isDateIcon
             * @type {Boolean}
             * @default true
             */
            isDateIcon: {
                value: true
            },

            /**
             * 是否显示节假日信息
             *
             * @attribute isHoliday
             * @type {Boolean}
             * @default true
             */
            isHoliday: {
                value: true,
                setter: function(v) {
                    this._dateMap = v ? Holidays.dates() : null;
                    return v;
                }
            },

            /**
             * 是否自动切换到结束时间
             *
             * @attribute isAutoSwitch
             * @type Boolean
             * @default false
             */
            isAutoSwitch: {
                value: false
            },

            /**
             * 是否允许开始时间和结束时间相同
             *
             * @attribute isSameDate
             * @type {Boolean}
             * @default false
             */
            isSameDate: {
                value: false
            },

            /**
             * 禁止点击的日期数组
             *
             * @attribute disabled
             * @type {Array} ['YYYY-MM-DD']
             * @default []
             */
            disabled: {
                value: []
            }
        }
    });

    return Calendar;

}, {
    requires: ['node', 'base', './datetools', './holidays', './index.css']
});