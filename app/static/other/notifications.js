class ElNotification extends HTMLElement{
    constructor() {
        super();
    }

    connectedCallback(){
        this.date = (this.getAttribute('date') - localTimeZoneOffset) * 1000;
        this.uuid = this.getAttribute('uuid');

        const btnsActions = {
            delete: () => {
                fetch(`/notifications/${this.uuid}/delete`, { method:"DELETE" })
                .then(res => res.ok && res.json())
                .then(res => {
                    if(!res || !res.success) return showModal('An error occured while deleting notification', translate('ptl'));

                    this.remove();
                });
            }
        }

        const translations = {
            comment: 'Новый <b>комментарий</b>',
            change: '<b>Изменение</b>'
        }
        
        setTimeout(() => {
            const dateElem = setClassName(document.createElement('span'), 'notification-date');
            dateElem.setAttribute('title', this.date ? longDateFormater.format(this.date) : '');
            dateElem.innerText = this.date ? middleDateFormater.format(this.date) : ''; 

            this.append(dateElem);
            dateElem.style.left = `calc(100% - ${dateElem.offsetWidth}px)`;

            for(let action in btnsActions){
                const btn = this.querySelector(`.notification-btns-${action}`);
                if(btn) btn.onclick = btnsActions[action];
            }


            if(currentShortLocale == 'ru'){
                this.querySelector('.notification-title').innerHTML = translations[this.getAttribute('type')]
            }
        }, 0)
    }
}

customElements.define('el-notification', ElNotification);

tasks.push(() => {

})