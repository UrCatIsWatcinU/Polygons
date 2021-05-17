
tasks.push(() => {
    document.body.style.setProperty('--max-row-w', document.querySelector('.user-content').offsetWidth + 'px');

    document.querySelector('.user-rating-cont').onclick = evt => {
        if(evt.target.classList.contains('user-rating-btn')){
            const btn = evt.target;
            const num = document.querySelector('.user-rating-num');

            let change = 0;
            if(btn.classList.contains('rating-plus')){
                change++;
            }else{
                change--;
            }

            fetch(`/users/${document.querySelector('.user-id').innerText}/rating/change`, {
                method: 'POST',
                body: JSON.stringify({
                    change: change
                })
            }).then(async res =>{
                if(!res.ok) return;
                res = await res.json();
                
                const plus = document.querySelector('.rating-plus');
                const minus = document.querySelector('.rating-minus');
                if(res.success){
                    if(res.change == -1){
                        minus.style.opacity = 0;
                        minus.style.pointerEvents = 'null';
                        
                        plus.style.opacity = 1;
                        plus.style.pointerEvents = 'auto';
                    }else if(res.change == 1){
                        plus.style.opacity = 0;
                        plus.style.pointerEvents = 'null';

                        minus.style.opacity = 1;
                        minus.style.pointerEvents = 'auto';
                    }else if(res.change == 0){
                        [minus, plus].forEach(b => {
                            b.style.opacity = 1;
                            b.style.pointerEvents = 'auto';
                        });
                    }
                    num.innerText = res.num ? res.num : '0'
                }else{
                    change = 0;
                }
            });
        }
    }

    Array.from(document.querySelectorAll('.hexagon')).forEach(hexagon => {
        const num = +hexagon.id.replace('h', '');

        hexagon.style.setProperty('--bgc', hexsColors[((num-1) - hexsColors.length * (Math.ceil((num-1) / hexsColors.length) - 1)) - 1]);
        if(num == 1){
            hexagon.classList.add('hexagon-first');
            hexagon.style.setProperty('--bgc', colors.MAIN_C);
        }
        setHexVisible(hexagon);
    });

    const deleteBtn = document.querySelector('.user-delete'); 
    if(deleteBtn){
        deleteBtn.onclick = () => {
            showAsk(() => {
                fetch('/users/delete/i', {
                    method: 'DELETE'
                })
                .then(res => {
                    if(res.ok) return res.json();
                    else showModal('An error occurred when deleting the profile', 'Please, try later. Status: ' + res.status);
                })
                .then(res => {
                    if(res && res.success) window.location.href = '/';
                    else showModal('An error occurred when deleting the profile', 'Please, try later.');
                })
                .catch(err => showModal('An error occurred when deleting the profile', err));
                
            }, 'You will not be able to cancel this action. Now, if you delete your account nobody can\'t restore it')
        }
    }
});