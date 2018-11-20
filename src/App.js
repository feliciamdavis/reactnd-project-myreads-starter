import React from 'react'
import { HashRouter, Route, Link } from 'react-router-dom'
import * as BooksAPI from './BooksAPI'
import './App.css'

window.BooksAPI = BooksAPI

// Based on: https://reactjs.org/docs/forms.html#the-select-tag
class BookShelfChanger extends React.Component {

    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this)
    }

    handleChange(event) {
        const newShelf = event.target.value
        this.props.notifyChange(newShelf)
    }

    render() {
        return (
            <div className="book-shelf-changer">
                <select value={this.props.shelf} onChange={this.handleChange}>
                    <option value="move" disabled>Move to...</option>
                    <option value="currentlyReading">Currently Reading</option>
                    <option value="wantToRead">Want to Read</option>
                    <option value="read">Read</option>
                    <option value="none">None</option>
                </select>
            </div>
        )
    }

}

class Book extends React.Component {

    constructor(props) {
        super(props)
        this.handleShelfChange = this.handleShelfChange.bind(this)
    }

    handleShelfChange(newShelf) {
        this.props.notifyChange(this.props.id, {
            shelf: newShelf
        })
    }

    render() {
        let coverURL = ''
        const imageLinks = this.props.imageLinks
        if (imageLinks) {
            coverURL = imageLinks.smallThumbnail
        }

        return (
            <div className="book">
                <div className="book-top">
                    <div className="book-cover" style={{ width: 128, height: 188, backgroundImage: `url("${coverURL}")` }}></div>
                    <BookShelfChanger shelf={this.props.shelf} notifyChange={this.handleShelfChange} />
                </div>
                <div className="book-title">{this.props.title}</div>
                <div className="book-authors">{
                    Array.isArray(this.props.authors)
                        ? this.props.authors.join(', ')
                        : ''
                }</div>
            </div>
        )
    }

}

class SearchPage extends React.Component {

    state = {
        searchResults: []
    }

    constructor(props) {
        super(props)
        this.handleBookChange = this.handleBookChange.bind(this)
        this.handleSearchChange = this.handleSearchChange.bind(this)
    }

    handleBookChange(bookID, bookChanges) {
        const book = this.state.searchResults.find(book => book.id === bookID)
        this.props.notifyBookChange(bookID, bookChanges, book)
    }

    handleSearchChange(event) {
        const inputEl = event.target
        const searchTerms = inputEl.value
        if (searchTerms) {
            BooksAPI.search(searchTerms).then(results => {

                // if search terms are not still the same then ignore these search results
                const isSameSearch = (searchTerms === inputEl.value)
                if (!isSameSearch) {
                    return
                }

                // update search results if no error or empty list if something bad happened
                if (!results.error) {
                    this.setState({
                        searchResults: results
                    })
                }
                else {
                    this.setState({
                        searchResults: []
                    })
                }

            })
        }
        else {
            // no search terms, no books -- deal with it
            this.setState({
                searchResults: []
            })
        }
    }

    getShelfForBook(searchResultsBook) {
        const myBook = this.props.books.find(book => book.id === searchResultsBook.id)

        if (myBook) {
            return myBook.shelf
        }

        return 'none'
    }

    render() {
        return (
            <div className="search-books">
                <div className="search-books-bar">
                    <Link className="close-search" to="/">Close</Link>
                    <div className="search-books-input-wrapper">
                        <input type="text" placeholder="Search by title or author" onChange={this.handleSearchChange} />
                    </div>
                </div>
                <div className="search-books-results">
                    <ol className="books-grid">
                        {
                            this.state.searchResults.map(bookData => {
                                const shelf = this.getShelfForBook(bookData)
                                return (
                                    <li key={bookData.id}>
                                        <Book {...bookData} shelf={shelf} notifyChange={this.handleBookChange} />
                                    </li>
                                )
                            })
                        }
                    </ol>
                </div>
            </div>
        )
    }

}

class MainPage extends React.Component {

    constructor(props) {
        super(props)
        this.handleBookChange = this.props.notifyBookChange
    }

    render() {
        const books = this.props.books

        const currentlyReading = books.filter(book => book.shelf === 'currentlyReading')
        const wantToRead = books.filter(book => book.shelf === 'wantToRead')
        const read = books.filter(book => book.shelf === 'read')

        return (
            <div className="list-books">
                <div className="list-books-title">
                    <h1>MyReads</h1>
                </div>
                <div className="list-books-content">
                    <div>
                        <div className="bookshelf">
                            <h2 className="bookshelf-title">Currently Reading</h2>
                            <div className="bookshelf-books">
                                <ol className="books-grid">
                                    {
                                        currentlyReading.map(bookData => {
                                            return (
                                                <li key={bookData.id}>
                                                    <Book {...bookData} notifyChange={this.handleBookChange} />
                                                </li>
                                            )
                                        })
                                    }

                                </ol>
                            </div>
                        </div>
                        <div className="bookshelf">
                            <h2 className="bookshelf-title">Want to Read</h2>
                            <div className="bookshelf-books">
                                <ol className="books-grid">
                                    {
                                        wantToRead.map(bookData => {
                                            return (
                                                <li key={bookData.id}>
                                                    <Book {...bookData} notifyChange={this.handleBookChange} />
                                                </li>
                                            )
                                        })
                                    }
                                </ol>
                            </div>
                        </div>
                        <div className="bookshelf">
                            <h2 className="bookshelf-title">Read</h2>
                            <div className="bookshelf-books">
                                <ol className="books-grid">
                                    {
                                        read.map(bookData => {
                                            return (
                                                <li key={bookData.id}>
                                                    <Book {...bookData} notifyChange={this.handleBookChange} />
                                                </li>
                                            )
                                        })
                                    }
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="open-search">
                    <Link to="/search">Add a book</Link>
                </div>
            </div >
        )
    }
}

class BooksApp extends React.Component {

    state = {
        books: []
    }

    constructor(props) {
        super(props)
        BooksAPI.getAll().then(results => {
            this.setState({
                books: results
            })
        })
        this.handleBookChange = this.handleBookChange.bind(this)
    }

    handleBookChange(bookID, bookChanges, newBook) {
        const foundBook = this.state.books.find(book => book.id === bookID)
        const book = foundBook || newBook

        // apply changes to book
        Object.assign(book, bookChanges)

        // if changing the book shelf, update the shelf on the server
        if (bookChanges.shelf) {
            BooksAPI.update(book, bookChanges.shelf).then(() => {
                console.log(`Moved ${book.title} to ${bookChanges.shelf}`)
            })
        }

        // add new book to library if not found
        if (!foundBook) {
            this.state.books.push(book)
        }

        // update state to show changes to books in library
        this.setState({
            books: this.state.books
        })
    }

    render() {
        return (
            <HashRouter>
                <div className="app">
                    <Route exact path="/" render={() => {
                        return <MainPage books={this.state.books} notifyBookChange={this.handleBookChange} />
                    }} />
                    <Route path="/search" render={() => {
                        return <SearchPage books={this.state.books} notifyBookChange={this.handleBookChange} />
                    }} />
                </div>
            </HashRouter>
        )
    }
}

export default BooksApp
