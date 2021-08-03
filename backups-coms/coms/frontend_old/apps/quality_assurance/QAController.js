export default app => {

    require('./QAProductionControllerExpanded')(app);
    require('./QualityTopBarDirective')(app);

    app.controller('QAController', function ($scope, $stateParams, $timeout, ApiService, Upload) {

        require("./style.scss");

        let OrderId = $stateParams.orderId;

        $scope.order = {
            id: 1,
            dealership: {
                name: "Koala Caravans"
            },
            model: {
                name: "Oz Classic"
            },
            series: {
                name: "18ft"
            },
            chassis: "NA84368",
            productionList: [
                {
                    id: 1,
                    category: "Chassis / Walls",
                    verifiedCount: 1,
                    items: [
                        {
                            item: "Take 2 or 3 images of the caravan at this stage",
                            verification: "no",
                            notes: [
                                {
                                    note: "This is done but we might need to review later",
                                    photos: [
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg"
                                    ]
                                },
                                {
                                    note: "And here is another note",
                                    photos: [
                                        "/media/series/IMG_5751.jpg"
                                    ]
                                }
                            ]
                        },
                        {
                            item: "Take 2 or 3 images of the caravan at this stage",
                            notes: [
                                {
                                    note: "This is done but we might need to review later",
                                    photos: [
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg"
                                    ]
                                }
                            ]
                        },
                        {
                            item: "Take 2 or 3 images of the caravan at this stage",
                            verification: "yes",
                            notes: [
                                {
                                    note: "This is done but we might need to review later",
                                    photos: [
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg"
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 2,
                    category: "Building",
                    verifiedCount: 3,
                    items: [
                        {
                            item: "Take 2 or 3 images of the caravan at this stage",
                            verification: "yes",
                            notes: [
                                {
                                    note: "This is done but we might need to review later",
                                    photos: [
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg"
                                    ]
                                }
                            ]
                        },
                        {
                            item: "Take 2 or 3 images of the caravan at this stage",
                            verification: "na",
                            notes: [
                                {
                                    note: "This is done but we might need to review later",
                                    photos: [
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg"
                                    ]
                                }
                            ]
                        },
                        {
                            item: "Take 2 or 3 images of the caravan at this stage",
                            verification: "yes",
                            notes: [
                                {
                                    note: "This is done but we might need to review later",
                                    photos: [
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg"
                                    ]
                                }
                            ]
                        },
                        {
                            item: "Take 2 or 3 images of the caravan at this stage",
                            verification: "no",
                            notes: [
                                {
                                    note: "This is done but we might need to review later",
                                    photos: [
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg"
                                    ]
                                },
                                {
                                    note: "And here is another note",
                                    photos: [
                                        "/media/series/IMG_5751.jpg"
                                    ]
                                }
                            ]
                        },
                        {
                            item: "Take 2 or 3 images of the caravan at this stage",
                            verification: "yes",
                            notes: [
                                {
                                    note: "This is done but we might need to review later",
                                    photos: [
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg"
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 3,
                    category: "Alluminium",
                    verifiedCount: 0,
                    items: [
                        {
                            item: "Take 2 or 3 images of the caravan at this stage",
                            verification: "no",
                            notes: [
                                {
                                    note: "This is done but we might need to review later",
                                    photos: [
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg"
                                    ]
                                }
                            ]
                        },
                        {
                            item: "Take 2 or 3 images of the caravan at this stage",
                            verification: "na",
                            notes: [
                                {
                                    note: "This is done but we might need to review later",
                                    photos: [
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg"
                                    ]
                                }
                            ]
                        },
                        {
                            item: "Take 2 or 3 images of the caravan at this stage",
                            verification: "no",
                            notes: [
                                {
                                    note: "This is done but we might need to review later",
                                    photos: [
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg"
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 4,
                    category: "External Fit Off",
                    verifiedCount: 3,
                    items: [
                        {
                            item: "Take 2 or 3 images of the caravan at this stage",
                            verification: "yes",
                            notes: [
                                {
                                    note: "This is done but we might need to review later",
                                    photos: [
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg"
                                    ]
                                }
                            ]
                        },
                        {
                            item: "Take 2 or 3 images of the caravan at this stage",
                            verification: "yes",
                            notes: [
                                {
                                    note: "This is done but we might need to review later",
                                    photos: [
                                        "/media/series/IMG_5751.jpg"
                                    ]
                                }
                            ]
                        },
                        {
                            item: "Take 2 or 3 images of the caravan at this stage",
                            verification: "yes",
                            notes: [
                                {
                                    note: "This is done but we might need to review later",
                                    photos: [
                                        "/media/series/IMG_5751.jpg",
                                        "/media/series/IMG_5751.jpg"
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }

        $scope.tabData = [
            {
                heading: 'Production Control',
                route: 'quality.production.expanded'
            },
            {
                heading: 'Quality Control',
                route: 'quality.quality.expanded',
            }
        ];

        $scope.status_classes = {
            1: 'yes',
            2: 'no',
            3: 'na'
        };

    });
};