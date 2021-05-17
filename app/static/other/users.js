tasks.push(() => {
    document.querySelectorAll('.user-in-list-btns').forEach(btns => {
        btns.querySelector('.user-in-list-delete').onclick = () => {
            showAsk(() => {
                fetch('/users/delete/' + btns.parentElement.id.replace('u', ''), {
                    method: 'DELETE'
                })
                .then(res => {
                    if(res.ok) return res.json();
                    else showModal('Cannot delete user', 'Status ' + res.statusText);
                })
                .then(res => {
                    if(res && res.success) btns.parentElement.remove();
                    else showModal('Cannot delete user', '');
                })
                .catch(err => showModal('Cannot delete user', err));
            }, 'If you delete user, all his changes will be deleted with him. You will not be able to undo this action')
        }
        btns.querySelector('.user-in-list-changeV').onclick = () => {
            fetch(`/users/${btns.parentElement.id.replace('u', '')}/change_visibility`, {
                method: 'PUT'
            })
            .then(res => {
                if(res.ok) return res.json();
                else showModal('Cannot change visibility of user', 'Status: ' + res.statusText);
            })
            .then(res => {
                if(res && res.success) btns.parentElement.classList.toggle('user-in-list-hidden');
                else showModal('Cannot change visibility of user', '');
            })
            .catch(err => showModal('Cannot change visibility of user', err))
        }
    });

    document.querySelector('.user-toggle-visibility').onclick = () => {
        fetch('/users/i/change_visibility', {
            method: 'PUT'
        })
        .then(res => {
            if(res.ok) return res.json()
        })
        .then(res => {
            if(res.success) window.location.reload();
        })
    }

    const maxRoleSize = Math.max(...Array.from(document.querySelectorAll('.role')).map(role => role.offsetWidth));

    const usersCssProps = {
        'role-size': maxRoleSize + 'px',
        'me-bgc': hexToRgb(colors.MAIN_C, .06)
    }

    setCSSProps(usersCssProps);
});