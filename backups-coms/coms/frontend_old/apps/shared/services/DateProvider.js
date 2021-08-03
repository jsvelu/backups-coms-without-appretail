
export default app => {
    app.factory('DateProvider', () => ({now: () => new Date()}));
}
