/**
 * @fileoverview 节假日处理模块
 * @author 昂天<fgm@fgm.cc>
 * @module holidays
 **/
KISSY.add(function (S, DateTools) {

// 2013——2020年节假日数据
var holidays = {
    yuandan: {
        name: '元旦',
        dates: [
        '2013-01-01',
        '2014-01-01',
        '2015-01-01',
        '2016-01-01',
        '2017-01-01',
        '2018-01-01',
        '2019-01-01',
        '2020-01-01'
        ]
    },
    chuxi: {
        name: '除夕',
        dates: [
        '2013-02-09',
        '2014-01-30',
        '2015-02-18',
        '2016-02-07',
        '2017-01-27',
        '2018-02-15',
        '2019-02-04',
        '2020-01-24'
        ]
    },
    chunjie: {
        name: '春节',
        dates: [
        '2013-02-10',
        '2014-01-31',
        '2015-02-19',
        '2016-02-08',
        '2017-01-28',
        '2018-02-16',
        '2019-02-05',
        '2020-01-25'
        ]
    },
    yuanxiao: {
        name: '元宵节',
        dates: [
        '2013-02-24',
        '2014-02-14',
        '2015-03-05',
        '2016-02-22',
        '2017-02-11',
        '2018-03-02',
        '2019-02-19',
        '2020-02-08'
        ]
    },
    qingming: {
        name: '清明',
        dates: [
        '2013-04-04',
        '2014-04-05',
        '2015-04-05',
        '2016-04-04',
        '2017-04-04',
        '2018-04-05',
        '2019-04-05',
        '2020-04-04'
        ]
    },
    wuyi: {
        name: '劳动节',
        dates: [
        '2013-05-01',
        '2014-05-01',
        '2015-05-01',
        '2016-05-01',
        '2017-05-01',
        '2018-05-01',
        '2019-05-01',
        '2020-05-01'
        ]
    },
    duanwu: {
        name: '端午节',
        dates: [
        '2013-06-12',
        '2014-06-02',
        '2015-06-20',
        '2016-06-09',
        '2017-05-30',
        '2018-06-18',
        '2019-06-07',
        '2020-06-25'
        ]
    },
    zhongqiu: {
        name: '中秋节',
        dates: [
        '2013-09-19',
        '2014-09-08',
        '2015-09-27',
        '2016-09-15',
        '2017-10-04',
        '2018-09-24',
        '2019-09-13'
        ]
    },
    guoqing: {
        name: '国庆节',
        dates: [
        '2013-10-01',
        '2014-10-01',
        '2015-10-01',
        '2016-10-01',
        '2017-10-01',
        '2018-10-01',
        '2019-10-01',
        '2020-10-01'
        ]
    }
};

return {

    /**
     * 2012——2013年节假日数据（包括节假日前1~3天/后1~3天）
     *
     * @method dates
     * @return {Object} 节假日对象
     */
    dates: function() {
        var tmp = {};
        var i;
        S.each(holidays, function(holiday) {
            S.each(holiday.dates, function(date) {
                for(i = 0; i < 7; i++) {
                    (function(date, i, v) {
                        tmp[date] = tmp[date] ? i > 2 ? v : tmp[date] : v;
                    })(DateTools.siblings(date, i - 3), i, holiday['name'] + (i != 3 ? (i < 3 ? '前' : '后') + Math.abs(i - 3) + '天' : ''));
                }
            });
        });
        return tmp;
    },

    /**
     * 获取指定日期的样式名
     *
     * @method getClassName
     * @param  {String}  v 日期字符串
     * @return {String}    样式名
     */
    getClassName: function(v) {   
        for (var property in holidays) {
            if (S.inArray(v, holidays[property]['dates'])) return property;
        }
        return '';
    }
};

}, {requires:['./datetools']});