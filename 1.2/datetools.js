/**
 * @fileoverview 日期处理模块
 * @author 昂天<fgm@fgm.cc>
 * @module datetools
 **/
KISSY.add(function(S) {

    var REG = /\d+/g;

    return {

        /**
         * 将日期字符串转为日期对象
         *
         * @method parse
         * @param  {String} v 日期字符串
         * @return {Date}     日期对象
         */
        parse: function (v) {
            v = v.match(REG);
            return v ? new Date(v[0], v[1] - 1, v[2]) : null;
        },

        /**
         * 将日期对象转为日期字符串
         *
         * @method stringify
         * @param  {Date} v 日期对象
         * @return {String} 日期字符串
         */
        stringify: function (v) {
            if (!S.isDate(v)) return null;
            return v.getFullYear() + '-' + this.filled(v.getMonth() * 1 + 1) + '-' + this.filled(v.getDate());
        },

        /**
         * 获取指定日期的兄弟日期
         *
         * @method siblings
         * @param  {String} v 日期字符串
         * @param  {Number} n 间隔天数，支持负数
         * @return {String}   日期字符串
         */
        siblings: function (v, n) {
            v = v.match(REG);
            return this.stringify(new Date(v[0], v[1] - 1, v[2] * 1 + n * 1));
        },
        
        /**
         * 获取指定日期的兄弟月份
         *
         * @method siblingsMonth
         * @param  {Date}   v 日期对象
         * @param  {Number} n 间隔月份，支持负数
         * @return {String}   日期对象
         */
        siblingsMonth: function (v, n) {
            return new Date(v.getFullYear(), v.getMonth() * 1 + n);
        },
       
        /**
         * 获取两个日期的间隔天数
         *
         * @method differ
         * @param  {String} v1 日期对象
         * @param  {String} v2 日期对象
         * @return {Number}    间隔天数
         */
        differ: function (v1, v2) {
            return parseInt(Math.abs(this.parse(v1) - this.parse(v2)) / 24 / 60 / 60 / 1000);
        },

        /**
         * 获取指定日期是星期几
         *
         * @method week
         * @param  {String} v 日期字符串
         * @return {String}   星期几
         */
        week: function (v) {
            return '星期' + ['日', '一', '二', '三', '四', '五', '六'][this.parse(v).getDay()];
        },

        /**
         * 验证指定日期子符串是否合法
         *
         * @method isDate
         * @param  {String} v 日期字符串
         * @return {Boolean}  true/false
         */
        isDate: function (v) {
            var reg = /^((19|2[01])\d{2})-(0?[1-9]|1[012])-(0?[1-9]|[12]\d|3[01])$/;

            if (!reg.test(v)) return false;

            return this.parse(v).getMonth() * 1 + 1 == v.match(REG)[1];
        },

        /**
         * 数字不足两位前面补0
         *
         * @method filled
         * @param  {Number} v 要补全的数字
         * @return {String} 补0后的字符串
         */
        filled: function (v) {
            return String(v).replace(/^(\d)$/, '0$1');
        }
    };
});