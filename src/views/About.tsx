import { Component, Vue } from 'vue-property-decorator';

@Component
export default class About extends Vue {
  render(): Vue.VNode {
    return (
      <div class="box">
        <article class>
          <div class="media-content">
            <div class="content">
              <p>
                Проект разработан вполне сознательно. Разработчикам хотелось
                выглядеть успешными. Но что сделано, то сделано. Теперь вы
                можете пользоваться трудами авторов совершенно свободно, без
                потерь. И не надо с сожалением перечитывать то, что написано под
                прикрытием редактирования.
              </p>
              <p>
                Мы не несем ни какой ответственности, но у нас нет средств
                получить ее! И на это есть причина!
              </p>
              <p>
                Обязательно найдите нас. Это ваш единственный шанс. Иначе все
                пропало. Здесь нет нужных людей, нет документов...
              </p>
              <p>
                Вопросы, жалобы и предложения принимаются тут:&nbsp;
                <a href="https://twitter.com/mgrankin" target="_blank">
                  mgrankin
                </a>
              </p>
            </div>
          </div>
        </article>
      </div>
    );
  }
}
