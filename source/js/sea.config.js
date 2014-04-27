seajs.config({
    paths: {
        'lib': '/js/lib',
        'monitor': '/js/monitor'
    },
    'alias': {
        '$': '//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js',
        'topicList': '/js/topic-list',
        'detector': 'lib/detector',
        'events': 'monitor/events',
        'aspect': 'monitor/aspect',
        'monitor': 'monitor/monitor',
        'monitor-perf': 'monitor/monitor-perf',
        'monitor-dlint': 'monitor/monitor-dlint',
        'monitor-seajs': 'monitor/monitor-seajs',
        'monitor-jsniffer': 'monitor/monitor-jsniffer',
        'monitor-heat': 'monitor/monitor-heatracker'
    },
    'charset': 'utf-8'
});