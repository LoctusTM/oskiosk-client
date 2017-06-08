import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ActivatedRoute, Params }   from '@angular/router';
import { Location }                 from '@angular/common';
import 'rxjs/add/operator/switchMap';

import { BackendService } from "./services/backend.service";
import { Product, Pricing, User, Identifiable, Cart } from "./models";
import { KeyCode, KeyCodeMap } from "./utils";

@Component({
    selector: 'product-list',
    templateUrl: './templates/product-list.html',
    providers: []
})
export class ProductListComponent implements OnInit{
    products: Product[];
    selectedProduct: Product;

    constructor(private backendService: BackendService) { }

    getProducts(): void {
        this.backendService.getProducts().subscribe(products => this.products = products);
    }

    onSelect(product: Product): void {
        this.selectedProduct = product;
    }

    ngOnInit(): void {
        this.getProducts();
    }
}

@Component({
    selector: 'product-detail',
    templateUrl: './templates/product-edit.html',
    providers: []
})
export class ProductEditComponent implements OnInit{
    product: Product;

    constructor(
        private backendService: BackendService,
        private route: ActivatedRoute,
        private location: Location
    ) { }

    addTag(): void {
        this.product.tags.push('');
    }

    ngOnInit(): void {
        this.route.params
        .switchMap((params: Params) => this.backendService.getProduct(+params['id']))
        .subscribe(product => this.product = product);
    }

    goBack(): void {
        this.location.back();
    }
}

@Component({
    selector: 'user-list',
    templateUrl: './templates/user-list.html',
    providers: []
})
export class UserListComponent implements OnInit{
    users: User[];
    filteredUsers: User[];
    _filter: string = '';

    get filter(): string {
        return this._filter;
    }

    set filter(value: string) {
        console.log(value);
        this._filter = value;
        this.filterUsers();
    }

    constructor(private backendService: BackendService) { }

    filterUsers(): void {
        this.filteredUsers = [];

        for(let user of this.users) {
            if(user.name.toLowerCase().includes(this._filter.toLowerCase())) {
                this.filteredUsers.push(user);
                continue;
            }
            for(let identifier of user.identifiers){
                if(identifier.toLowerCase().includes(this._filter.toLowerCase())){
                    this.filteredUsers.push(user);
                    continue;
                }
            }
        }
    }

    getUsers(): void {
        this.backendService.getUsers().then(users => { this.users = users; this.filterUsers(); });
    }

    ngOnInit(): void {
        this.getUsers();
    }
}

@Component({
    selector: 'cashdesk',
    templateUrl: './templates/cashdesk.html',
    providers: []
})
export class CashdeskComponent implements OnInit, OnDestroy{
    identifierInput: string = '';
    cart: Cart;
    wait_identifier: boolean = false;
    wait_checkout: boolean = false;
    alert_barcode_not_found: boolean = false;

    constructor(
        private backendService: BackendService
    ) {
        this.cart = new Cart();
    }

    onKeyDownEvent(e: KeyboardEvent): void {
        let literal: string = KeyCodeMap.getLiteral(e.keyCode);
        if(literal){
            this.identifierInput = this.identifierInput.concat(literal);
            this.alert_barcode_not_found = false;
        }
        else if (e.keyCode == KeyCode.ENTER){
            if(this.identifierInput){
                this.confirmInput();
            }
            else {
                this.payCart();
            }
            
        }
        else if (e.keyCode == KeyCode.BACKSPACE){
            this.identifierInput = this.identifierInput.substr(0, this.identifierInput.length - 1)
        }
    }

    confirmInput(): void {
        this.wait_identifier = true;
        this.backendService.getItemByIdentifier(this.identifierInput)
            .then(item => {
                this.wait_identifier = false;
                this.processItem(item)
            })
            .catch(reason => {
                this.wait_identifier = false;
                this.alert_barcode_not_found = true;
            });
        this.identifierInput = '';
    }

    processItem(item: Identifiable): void {
        if(item instanceof Product){
            this.cart.addToCart(item, item.pricings[0]); // hackedyhack ... select proper pricing instead
        }
        else if(item instanceof User){
            this.cart.user = item;
        }
    }

    payCart(): void {
        this.wait_checkout = true;
        this.backendService.payCart(this.cart).then(transaction => {
            this.wait_checkout = false;
            this.cart = new Cart();
        })
    }

    abort(): void {
        this.cart = new Cart();
    }

    // Magic fat arrow to keep "this" reference intact
    keyEventProxy = (e: KeyboardEvent): void => {
        this.onKeyDownEvent(e);
    }
   
    ngOnInit(): void {
        document.addEventListener('keydown', this.keyEventProxy, false);
    }

    ngOnDestroy(): void {
        document.removeEventListener('keydown', this.keyEventProxy, false);
    }

}