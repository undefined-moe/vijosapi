const
    axios = require('axios'),
    jsdom = require('jsdom'),
    { JSDOM } = jsdom,
    ID = url => {
        let path = url.split('/');
        return path[path.length - 1];
    },
    transformRequest = [data => {
        let ret = '';
        for (let it in data)
            if (data[it] !== '') {
                if (ret !== '') ret += '&';
                ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]);
            }
        return ret;
    }];
String.prototype.Trim = function () {
    return this.replace(/(^\s*)|(\s*$)/g, "");
}
String.prototype.LTrim = function () {
    return this.replace(/(^\s*)/g, "");
}
String.prototype.RTrim = function () {
    return this.replace(/(\s*$)/g, "");
}
module.exports = class {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }
    async login(uname, password) {
        let login = await axios.post(this.baseURL + '/login', { uname, password }, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            transformRequest
        });
        let cookie = login.headers['set-cookie'][0].split(';')[0].split('=')[1];
        console.log('cookie:', cookie);
        return cookie;
    }
    async problemList(page) {
        let data = await axios.get(this.baseURL + '/p?page=' + page);
        let DOM = new JSDOM(data.data.fragments[0].html);
        let tbody = DOM.window.document.getElementsByTagName('tbody');
        tbody = tbody[0];
        let list = [];
        for (let i in tbody.children) {
            let children = tbody.children[i].children;
            if (children) {
                let col_name = children[0];
                let submit = children[1].innerHTML;
                let AC = children[2].innerHTML;
                let difficulty = children[3].innerHTML;
                let href = col_name.children[0].href;
                let name = col_name.children[0].innerHTML.Trim();
                let id = ID(href);
                list.push({ id, name, href, submit, AC, difficulty });
            }
        }
        return list;
    }
    async problemDetail(id) {
        let data = await axios.get(this.baseURL + '/p/' + id);
        let DOM = new JSDOM(data.data);
        return DOM.window.document.getElementsByClassName('section__body typo')[0].innerHTML;
    }
    async problemSubmit(id, lang, code, cookie) {
        let res = await axios.get(this.baseURL + '/p/' + id + '/submit', {
            headers: {
                accept: 'text/html',
                cookie: 'sid=' + cookie,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            transformRequest
        });
        let DOM = new JSDOM(res.data);
        let csrf_token = (DOM.window.document.getElementsByName('csrf_token'))[0].value;
        console.log('csrf_token:', csrf_token);
        let resp = await axios.post(this.baseURL + '/p/' + id + '/submit', { lang, code, csrf_token }, {
            headers: {
                accept: 'text/html',
                cookie: 'sid=' + cookie,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            transformRequest
        });
        console.log(resp.request.path.split('/')[2]);
        return resp.request.path.split('/')[2];
    }
    async recordStatus(rid) {
        let data = await axios.get(this.baseURL + '/records/' + rid);
        let DOM = new JSDOM(data.data);
        let title = (DOM.window.document.getElementsByClassName('section__title'))[0];
        let status = title.children[1].innerHTML.Trim();
        let summary = DOM.window.document.getElementById('summary');
        let score = summary.children[1].innerHTML;
        let time = summary.children[3].innerHTML;
        let mem = summary.children[5].innerHTML;
        let compiler_text = '';
        let compiler = (DOM.window.document.getElementsByClassName('compiler-text'))[0];
        if (compiler) compiler_text = compiler.innerHTML;
        let details = [];
        let tbody = (DOM.window.document.getElementsByTagName('tbody'))[0];
        if (tbody)
            for (let i in tbody.children) {
                let children = tbody.children[i].children;
                if (children) {
                    let status = children[1].children[1].innerHTML.Trim();
                    let time = children[2].innerHTML;
                    let mem = children[3].innerHTML;
                    details.push({ status, time, mem });
                }
            }
        return { status, score, time, mem, details, compiler_text };
    }
};
