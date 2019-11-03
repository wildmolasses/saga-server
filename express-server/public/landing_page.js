'use strict';

const e = React.createElement;

class EmailForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: 'testing'};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e) {
    this.setState({value: event.target.value});
  }

  handleSubmit(e) {
    alert('A name was submitted: ' + this.state.value);
    event.preventDefault();
  }

  render() {
    return (e(
                'form', 
                {className: 'EmailForm', onSubmit: this.handleSubmit},
                "Modern version control for any file format", e("br"),
                e('input', {onChange: this.handleChange}), e("br"),
                e('button', {type: 'submit'}, "Join the mailing list"), e("br")
            )
    );
  }
}

const domContainer = document.querySelector('#email_form');
ReactDOM.render(e(EmailForm), domContainer);