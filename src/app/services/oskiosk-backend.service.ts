import { Product, User, Identifiable, Cart, PaymentTransaction } from "../models";
import { BackendService } from "app/services/backend.service";
import { Http, Response, Headers, RequestOptions } from "@angular/http";

import { deserialize, deserializeArray, serialize } from "class-transformer";

import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';


export class OskioskBackendService extends BackendService{
    
    constructor(private http: Http, private api_url: string, private api_token: string){
        super();
    }
    
    private getDefaultRequestOptions(): RequestOptions {
        let headers = new Headers({
            'Authorization': 'Bearer ' + this.api_token,
            'Content-Type': 'application/json'
        });
        return new RequestOptions({ headers: headers });
    }    

    private httpGet(url: string): Observable<Response> {
        return this.http.get(this.api_url + url, this.getDefaultRequestOptions())
    }

    private httpPost(url: string, data: string): Observable<Response> {
        return this.http.post(this.api_url + url, data, this.getDefaultRequestOptions())
    }

    private httpPatch(url: string, data: string): Observable<Response> {
        return this.http.patch(this.api_url + url, data, this.getDefaultRequestOptions())
    }

    private handleError (error: Response | any) {
        console.log(error);
        return Observable.throw('Error!');
    }

    private handleIdentifierResponse(res: Response) {
        let json = res.json();
        if(json['type'] == 'user'){
            return deserializeArray(User, res.text());
        }
        else if(json['type'] == 'product'){
            return deserializeArray(Product, res.text());
        }
    }

    getProducts(): Observable<Product[]> {
        return this.httpGet('/products.json')
        .map((res: Response) => { return deserializeArray(Product, res.text()); })
        .catch(this.handleError);
    }
    
    getProduct(id: number): Observable<Product> {
        return this.httpGet('/products/' + id + '.json')
        .map((res: Response) => { return deserialize(Product, res.text()); })
        .catch(this.handleError);
    }
    
    getUsers(): Observable<User[]> {
        return this.httpGet('/users.json')
        .map((res: Response) => { return deserializeArray(User, res.text()); })
        .catch(this.handleError);
    }
    
    getUser(id: number): Observable<User> {
        return this.httpGet('/users/' + id + '.json')
        .map((res: Response) => { return deserialize(User, res.text()); })
        .catch(this.handleError);
    }
    
    getItemByIdentifier(identifier: string): Observable<Identifiable> {
        return this.httpGet('/identifiers/' + identifier + '.json')
        .map(this.handleIdentifierResponse)
        .catch(this.handleError);
    }
    
    payCart(cart: Cart): Observable<PaymentTransaction> {
        console.log(cart);
        return this.httpPost('/carts/' + cart.id + '/pay.json', JSON.stringify({'cart_id': cart.id}))
        .map((res: Response) => { return deserialize(PaymentTransaction, res.text()); })
        .catch(this.handleError);
    }

    saveProduct(product: Product): Observable<Product> {
        return this.httpPatch('/products/' + product.id + '.json', serialize(product))
        .map((res: Response) => { return deserialize(Product, res.text()); })
        .catch(this.handleError);
    }

    createOrUpdateCart(cart: Cart): Observable<Cart> {
        let observable: Observable<Response>;
        if(cart.id){
            observable = this.httpPatch('/carts/' + cart.id + '.json', serialize(cart))
        }
        else {
            observable = this.httpPost('/carts.json', serialize(cart))
        }
        return observable
        .map((res: Response) => { return deserialize(Cart, res.text()); })
        .catch(this.handleError);
    }
}
